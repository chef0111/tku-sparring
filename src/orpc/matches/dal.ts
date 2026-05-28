import { MatchStatusSchema } from './dto';
import {
  advanceWinner,
  applyRound0ByeAdvancement,
  clearWinnerAdvancement,
} from './match-progression';
import {
  assignRound0Slot,
  setRound0SlotLock,
  swapRound0Slots,
} from './round0-slot-editor';
import { assertCustomMatchDisplayLabelAvailable } from './custom-match-label';
import { throwMatchBadRequest } from './match-domain-error';
import {
  clearAllGroupMatchRowsData,
  clearBracketUpperRoundData,
  round0ShuffleResetPatch,
  shuffleAthletePool,
} from './bracket-helpers';
import { buildRound0Baseline, parseRound0Baseline } from './round0-baseline';
import type { Round0BaselineV1 } from './round0-baseline';
import type {
  AdminSetMatchStatusDTO,
  AssignSlotDTO,
  CreateCustomMatchDTO,
  CreateMatchDTO,
  CustomSlotDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateMatchDTO,
  UpdateScoreDTO,
} from './dto';
import type { PrismaClient } from '@prisma/client';
import {
  nextPowerOfTwo,
  planBracketShell,
  planRound0Placements,
} from '@/lib/tournament/bracket-shape';
import {
  getAdminStatusTransition,
  getScoreTransition,
  getWinnerOverrideTransition,
} from '@/lib/tournament/match-transition';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { publishMatchInvalidateEvent } from '@/lib/tournament/tournament-sse-bus';
import { prisma } from '@/lib/db';

const MATCH_CUSTOM_ROUND = 900;

type MatchBracketWriteDb = Pick<
  PrismaClient,
  'match' | 'tournamentAthlete' | 'group'
>;

type GroupBaselineRow = { round0Baseline?: unknown };

function groupUpdateRound0Baseline(
  db: MatchBracketWriteDb,
  groupId: string,
  baseline: ReturnType<typeof buildRound0Baseline> | null
) {
  return db.group.update({
    where: { id: groupId },
    data: { round0Baseline: baseline } as never,
  });
}

export class MatchDAL {
  private static coalesceMatchRead<
    T extends {
      kind?: string | null;
      displayLabel?: string | null;
    },
  >(m: T): T & { kind: 'bracket' | 'custom'; displayLabel: string | null } {
    return {
      ...m,
      kind: m.kind === 'custom' ? 'custom' : 'bracket',
      displayLabel: m.displayLabel ?? null,
    };
  }

  static async findByGroupId(groupId: string) {
    const rows = await prisma.match.findMany({
      where: { groupId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    return rows.map((m) => MatchDAL.coalesceMatchRead(m));
  }

  static async findByTournamentId(tournamentId: string) {
    const rows = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    return rows.map((m) => MatchDAL.coalesceMatchRead(m));
  }

  static async findById(id: string) {
    const m = await prisma.match.findUnique({ where: { id } });
    if (!m) return null;
    return MatchDAL.coalesceMatchRead(m);
  }

  static async create(data: CreateMatchDTO) {
    const m = await prisma.match.create({ data });
    return MatchDAL.coalesceMatchRead(m);
  }

  static async update(id: string, data: Omit<UpdateMatchDTO, 'id'>) {
    const m = await prisma.match.update({ where: { id }, data });
    return MatchDAL.coalesceMatchRead(m);
  }

  static async deleteMatch(id: string) {
    const m = await prisma.match.delete({ where: { id } });
    return MatchDAL.coalesceMatchRead(m);
  }

  static async generateBracket(
    input: GenerateBracketDTO,
    adminId: string,
    options?: { skipActivity?: boolean }
  ) {
    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Brackets can only be generated in Draft status');
    }

    const existing = await prisma.match.count({
      where: { groupId: input.groupId, kind: 'bracket' },
    });
    if (existing > 0) {
      throw new Error(
        'Matches already exist for this group. Use regenerate to recreate.'
      );
    }

    const athletes = await prisma.tournamentAthlete.findMany({
      where: { groupId: input.groupId },
      orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
    });

    if (athletes.length < 2) {
      throw new Error('At least 2 athletes are required to generate a bracket');
    }

    const shell = planBracketShell({
      groupId: input.groupId,
      tournamentId: group.tournamentId,
      athleteCount: athletes.length,
      thirdPlaceMatch: group.thirdPlaceMatch,
    });

    await Promise.all(
      shell.matches.map((m) => prisma.match.create({ data: m }))
    );

    if (!options?.skipActivity) {
      await recordTournamentActivity({
        tournamentId: group.tournamentId,
        adminId,
        eventType: 'bracket.generate',
        entityType: 'group',
        entityId: input.groupId,
        payload: {
          athleteCount: athletes.length,
          bracketSize: shell.bracketSize,
          mode: 'shell',
        },
      });
    }

    return MatchDAL.findByGroupId(input.groupId);
  }

  static async resetBracket(groupId: string, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Reset only allowed in Draft status');
    }

    const baseline = parseRound0Baseline(
      (group as typeof group & GroupBaselineRow).round0Baseline
    );
    if (!baseline) {
      throw new Error(
        'No saved bracket layout yet. Shuffle once to save a layout, then reset can restore it.'
      );
    }

    await MatchDAL.restoreBracketFromRound0Baseline(
      prisma,
      groupId,
      group.tournamentId,
      baseline
    );

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.reset',
      entityType: 'group',
      entityId: groupId,
      payload: {},
    });

    return MatchDAL.findByGroupId(groupId);
  }

  /**
   * Re-seeds round 0 from a shuffled athlete pool, clears higher-round progression,
   * then applies round-0 bye advancement. Used by shuffle only.
   *
   * Persists {@link buildRound0Baseline} on the group after placements (pre-bye) so
   * {@link MatchDAL.resetBracket} can restore that layout without reshuffling.
   *
   * Clears all **Match** bout state in the **Group** (custom rows + bracket upper rounds,
   * then round-0 bracket rows while preserving locked slots) before placements so tree
   * and layout stay consistent.
   */
  private static async runBracketShufflePlacements(
    db: MatchBracketWriteDb,
    groupId: string,
    tournamentId: string
  ): Promise<void> {
    const allMatches = await db.match.findMany({
      where: { groupId, kind: 'bracket' },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    if (allMatches.length === 0) {
      throw new Error('No bracket yet. Generate a bracket first.');
    }

    const athletes = await db.tournamentAthlete.findMany({
      where: { groupId },
      orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
    });

    const round0 = allMatches.filter((m) => m.round === 0);
    round0.sort((a, b) => a.matchIndex - b.matchIndex);

    const lockedIds = new Set<string>();
    for (const m of round0) {
      if (m.redLocked && m.redTournamentAthleteId) {
        lockedIds.add(m.redTournamentAthleteId);
      }
      if (m.blueLocked && m.blueTournamentAthleteId) {
        lockedIds.add(m.blueTournamentAthleteId);
      }
    }

    const bracketSizeFromTree = round0.length * 2;
    const bracketSize = nextPowerOfTwo(athletes.length);
    if (bracketSizeFromTree !== bracketSize) {
      throw new Error(
        'Bracket shell size does not match athlete count; regenerate the bracket.'
      );
    }

    await Promise.all([
      db.match.updateMany({
        where: { groupId, kind: 'custom' },
        data: clearAllGroupMatchRowsData(),
      }),
      db.match.updateMany({
        where: { groupId, kind: 'bracket', round: { gte: 1 } },
        data: clearBracketUpperRoundData(),
      }),
      ...round0.map((m) =>
        db.match.update({
          where: { id: m.id },
          data: round0ShuffleResetPatch(m),
        })
      ),
    ]);

    const round0Fresh = await db.match.findMany({
      where: { groupId, kind: 'bracket', round: 0 },
      orderBy: { matchIndex: 'asc' },
    });

    const lockedIdsFresh = new Set<string>();
    for (const m of round0Fresh) {
      if (m.redLocked && m.redTournamentAthleteId) {
        lockedIdsFresh.add(m.redTournamentAthleteId);
      }
      if (m.blueLocked && m.blueTournamentAthleteId) {
        lockedIdsFresh.add(m.blueTournamentAthleteId);
      }
    }

    const pool = athletes.filter((a) => !lockedIdsFresh.has(a.id));
    const shuffled = shuffleAthletePool(pool);

    const placementAthletes = athletes.map((a) => ({
      id: a.id,
      athleteProfileId: a.athleteProfileId,
    }));

    const round0ForPlan = round0Fresh.map((m) => ({
      id: m.id,
      matchIndex: m.matchIndex,
      redLocked: m.redLocked,
      blueLocked: m.blueLocked,
      redTournamentAthleteId: m.redTournamentAthleteId,
      blueTournamentAthleteId: m.blueTournamentAthleteId,
      redAthleteId: m.redAthleteId,
      blueAthleteId: m.blueAthleteId,
    }));

    const placementPlan = planRound0Placements({
      bracketSize,
      athletes: placementAthletes,
      round0Matches: round0ForPlan,
      shuffledAthletes: shuffled.map((a) => ({
        id: a.id,
        athleteProfileId: a.athleteProfileId,
      })),
    });

    await Promise.all(
      placementPlan.updates.map((update) =>
        db.match.update({
          where: { id: update.matchId },
          data: update.data,
        })
      )
    );

    const placedForBaseline = await db.match.findMany({
      where: { groupId, kind: 'bracket', round: 0 },
      orderBy: { matchIndex: 'asc' },
    });
    await groupUpdateRound0Baseline(
      db,
      groupId,
      buildRound0Baseline(placedForBaseline)
    );

    await applyRound0ByeAdvancement(groupId, tournamentId, db);
  }

  private static async restoreBracketFromRound0Baseline(
    db: MatchBracketWriteDb,
    groupId: string,
    tournamentId: string,
    baseline: Round0BaselineV1
  ): Promise<void> {
    const slotsSorted = [...baseline.slots].sort(
      (a, b) => a.matchIndex - b.matchIndex
    );

    const allMatches = await db.match.findMany({
      where: { groupId, kind: 'bracket' },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    if (allMatches.length === 0) {
      throw new Error('No bracket yet. Generate a bracket first.');
    }

    const athletes = await db.tournamentAthlete.findMany({
      where: { groupId },
      orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
    });

    const round0 = allMatches.filter((m) => m.round === 0);
    round0.sort((a, b) => a.matchIndex - b.matchIndex);

    const bracketSizeFromTree = round0.length * 2;
    const bracketSize = nextPowerOfTwo(athletes.length);
    if (bracketSizeFromTree !== bracketSize) {
      throw new Error(
        'Bracket shell size does not match athlete count; regenerate the bracket.'
      );
    }

    if (slotsSorted.length !== round0.length) {
      throw new Error(
        'Saved bracket layout is out of date. Shuffle once to refresh it.'
      );
    }

    const athleteIds = new Set(athletes.map((a) => a.id));
    for (const s of slotsSorted) {
      if (!round0.some((r) => r.matchIndex === s.matchIndex)) {
        throw new Error(
          'Saved bracket layout is out of date. Shuffle once to refresh it.'
        );
      }
      for (const ta of [s.redTournamentAthleteId, s.blueTournamentAthleteId]) {
        if (ta != null && !athleteIds.has(ta)) {
          throw new Error(
            'Group athletes changed since the saved layout. Shuffle once to refresh it.'
          );
        }
      }
    }

    await Promise.all([
      db.match.updateMany({
        where: { groupId, kind: 'custom' },
        data: clearAllGroupMatchRowsData(),
      }),
      db.match.updateMany({
        where: { groupId, kind: 'bracket', round: { gte: 1 } },
        data: clearBracketUpperRoundData(),
      }),
      ...round0.map((m) =>
        db.match.update({
          where: { id: m.id },
          data: round0ShuffleResetPatch(m),
        })
      ),
    ]);

    await Promise.all(
      slotsSorted.map((s) => {
        const row = round0.find((r) => r.matchIndex === s.matchIndex)!;
        return db.match.update({
          where: { id: row.id },
          data: {
            redTournamentAthleteId: s.redTournamentAthleteId,
            blueTournamentAthleteId: s.blueTournamentAthleteId,
            redAthleteId: s.redAthleteId,
            blueAthleteId: s.blueAthleteId,
            redLocked: s.redLocked,
            blueLocked: s.blueLocked,
            redWins: 0,
            blueWins: 0,
            winnerId: null,
            winnerTournamentAthleteId: null,
            status: 'pending',
          },
        });
      })
    );

    await applyRound0ByeAdvancement(groupId, tournamentId, db);
  }

  static async shuffleBracket(groupId: string, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Shuffle only allowed in Draft status');
    }

    await MatchDAL.runBracketShufflePlacements(
      prisma,
      groupId,
      group.tournamentId
    );

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.shuffle',
      entityType: 'group',
      entityId: groupId,
      payload: {},
    });

    return MatchDAL.findByGroupId(groupId);
  }

  static async regenerateBracket(groupId: string, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Regeneration only allowed in Draft status');
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.updateMany({
        where: { groupId },
        data: clearAllGroupMatchRowsData(),
      });
      await tx.match.deleteMany({ where: { groupId } });

      const athletes = await tx.tournamentAthlete.findMany({
        where: { groupId },
        orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
      });
      if (athletes.length < 2) {
        throw new Error(
          'At least 2 athletes are required to generate a bracket'
        );
      }

      const shell = planBracketShell({
        groupId,
        tournamentId: group.tournamentId,
        athleteCount: athletes.length,
        thirdPlaceMatch: group.thirdPlaceMatch,
      });

      await Promise.all(
        shell.matches.map((row) => tx.match.create({ data: row }))
      );

      await groupUpdateRound0Baseline(tx, groupId, null);
    });

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.regenerate',
      entityType: 'group',
      entityId: groupId,
      payload: {},
    });

    return MatchDAL.findByGroupId(groupId);
  }

  static async setLock(input: SetLockDTO) {
    return setRound0SlotLock(input);
  }

  static async assignSlot(input: AssignSlotDTO, adminId: string) {
    return assignRound0Slot(input, adminId);
  }

  static async swapSlots(input: SwapSlotsDTO, adminId: string) {
    return swapRound0Slots(input, adminId);
  }

  static async updateScore(input: UpdateScoreDTO, adminId: string) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
    });
    if (!match) throw new Error('Match not found');

    const transition = getScoreTransition({
      match,
      redWins: input.redWins,
      blueWins: input.blueWins,
    });

    if (transition.clearAdvancement) {
      await clearWinnerAdvancement(match);
    }

    const updated = await prisma.match.update({
      where: { id: input.matchId },
      data: transition.data,
    });

    if (
      transition.data.status === 'complete' &&
      transition.advanceWinnerTournamentAthleteId
    ) {
      await advanceWinner(
        input.matchId,
        transition.advanceWinnerTournamentAthleteId
      );
    }

    await recordTournamentActivity({
      tournamentId: match.tournamentId,
      adminId,
      eventType: 'match.score_edit',
      entityType: 'match',
      entityId: input.matchId,
      payload: {
        redWins: input.redWins,
        blueWins: input.blueWins,
        status: transition.data.status,
      },
    });

    publishMatchInvalidateEvent(match.tournamentId);

    return MatchDAL.coalesceMatchRead(updated);
  }

  static async setWinner(input: SetWinnerDTO, adminId: string) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
    });
    if (!match) throw new Error('Match not found');

    const transition = getWinnerOverrideTransition({
      match,
      winnerSide: input.winnerSide,
    });

    const updated = await prisma.match.update({
      where: { id: input.matchId },
      data: transition.data,
    });

    if (transition.advanceWinnerTournamentAthleteId) {
      await advanceWinner(
        input.matchId,
        transition.advanceWinnerTournamentAthleteId
      );
    }

    await recordTournamentActivity({
      tournamentId: match.tournamentId,
      adminId,
      eventType: 'match.winner_override',
      entityType: 'match',
      entityId: input.matchId,
      payload: {
        winnerSide: input.winnerSide,
        reason: input.reason,
      },
    });

    publishMatchInvalidateEvent(match.tournamentId);

    return MatchDAL.coalesceMatchRead(updated);
  }

  static async swapParticipants(input: SwapParticipantsDTO, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        include: { group: { include: { tournament: true } } },
      });
      if (!match) throw new Error('Match not found');

      const status = match.group.tournament.status;
      if (status === 'completed') {
        throw new Error('Cannot swap participants in a completed tournament');
      }

      const redAthlete = input.redTournamentAthleteId
        ? await tx.tournamentAthlete.findUnique({
            where: { id: input.redTournamentAthleteId },
          })
        : null;
      const blueAthlete = input.blueTournamentAthleteId
        ? await tx.tournamentAthlete.findUnique({
            where: { id: input.blueTournamentAthleteId },
          })
        : null;

      const updated = await tx.match.update({
        where: { id: input.matchId },
        data: {
          redTournamentAthleteId: input.redTournamentAthleteId,
          blueTournamentAthleteId: input.blueTournamentAthleteId,
          redAthleteId: redAthlete?.athleteProfileId ?? null,
          blueAthleteId: blueAthlete?.athleteProfileId ?? null,
        },
      });

      await recordTournamentActivity(
        {
          tournamentId: match.tournamentId,
          adminId,
          eventType: 'match.swap_participants',
          entityType: 'match',
          entityId: input.matchId,
          payload: {
            previousRedTournamentAthleteId: match.redTournamentAthleteId,
            previousBlueTournamentAthleteId: match.blueTournamentAthleteId,
            redTournamentAthleteId: input.redTournamentAthleteId,
            blueTournamentAthleteId: input.blueTournamentAthleteId,
          },
        },
        tx
      );

      return MatchDAL.coalesceMatchRead(updated);
    });
  }

  static async adminSetMatchStatus(
    input: AdminSetMatchStatusDTO,
    adminId: string
  ) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
    });
    if (!match) throw new Error('Match not found');

    const current = MatchStatusSchema.parse(match.status);
    const next = input.status;
    const transition = getAdminStatusTransition({
      match,
      status: next,
    });

    if (transition.clearAdvancement) {
      await clearWinnerAdvancement(match);
    }

    let updated = await prisma.match.update({
      where: { id: input.matchId },
      data: transition.data,
    });

    if (next === 'complete' && !transition.clearedScores) {
      const scoreTransition = getScoreTransition({
        match: { ...match, ...updated },
        redWins: updated.redWins,
        blueWins: updated.blueWins,
      });

      if (scoreTransition.data.status === 'complete') {
        updated = await prisma.match.update({
          where: { id: input.matchId },
          data: {
            redWins: scoreTransition.data.redWins,
            blueWins: scoreTransition.data.blueWins,
            winnerId: scoreTransition.data.winnerId ?? null,
            winnerTournamentAthleteId:
              scoreTransition.data.winnerTournamentAthleteId ?? null,
            status: 'complete',
          },
        });

        if (scoreTransition.advanceWinnerTournamentAthleteId) {
          await advanceWinner(
            input.matchId,
            scoreTransition.advanceWinnerTournamentAthleteId
          );
        }
      }
    }

    await recordTournamentActivity({
      tournamentId: match.tournamentId,
      adminId,
      eventType: 'match.status_admin',
      entityType: 'match',
      entityId: input.matchId,
      payload: {
        fromStatus: current,
        toStatus: next,
        clearedScores: transition.clearedScores,
      },
    });

    publishMatchInvalidateEvent(match.tournamentId);

    return MatchDAL.coalesceMatchRead(updated);
  }

  private static async resolveCustomSlot(
    groupId: string,
    _tournamentId: string,
    slot: CustomSlotDTO
  ): Promise<{
    tournamentAthleteId: string;
    athleteProfileId: string | null;
  }> {
    if (slot.mode === 'direct') {
      const ta = await prisma.tournamentAthlete.findFirst({
        where: { id: slot.tournamentAthleteId, groupId },
      });
      if (!ta)
        throwMatchBadRequest('Tournament athlete not found in this group');
      return {
        tournamentAthleteId: ta.id,
        athleteProfileId: ta.athleteProfileId,
      };
    }

    const feeder = await prisma.match.findFirst({
      where: { id: slot.feederMatchId, groupId },
    });
    if (!feeder) throwMatchBadRequest('Feeder match not found in this group');
    if (feeder.kind === 'custom') {
      throwMatchBadRequest(
        'Bracket matches only — custom matches cannot be feeders'
      );
    }
    if (feeder.status !== 'complete') {
      throwMatchBadRequest('Feeder match must be complete');
    }
    if (!feeder.winnerTournamentAthleteId) {
      throwMatchBadRequest('Feeder match has no winner');
    }

    if (slot.mode === 'winner') {
      if (
        feeder.redTournamentAthleteId == null ||
        feeder.blueTournamentAthleteId == null
      ) {
        throwMatchBadRequest(
          'Winner slot requires both athletes present in the feeder match'
        );
      }
      const ta = await prisma.tournamentAthlete.findUnique({
        where: { id: feeder.winnerTournamentAthleteId },
        select: { athleteProfileId: true },
      });
      if (!ta) throwMatchBadRequest('Winner tournament athlete missing');
      return {
        tournamentAthleteId: feeder.winnerTournamentAthleteId,
        athleteProfileId: ta.athleteProfileId,
      };
    }

    if (
      feeder.redTournamentAthleteId == null ||
      feeder.blueTournamentAthleteId == null
    ) {
      throwMatchBadRequest(
        'Loser slot requires both athletes in the feeder match'
      );
    }
    const w = feeder.winnerTournamentAthleteId;
    let loserTa: string | null = null;
    if (w === feeder.redTournamentAthleteId) {
      loserTa = feeder.blueTournamentAthleteId;
    } else if (w === feeder.blueTournamentAthleteId) {
      loserTa = feeder.redTournamentAthleteId;
    } else {
      throwMatchBadRequest('Winner does not match a feeder corner');
    }
    if (!loserTa) throwMatchBadRequest('Could not resolve loser');

    const ta = await prisma.tournamentAthlete.findUnique({
      where: { id: loserTa },
      select: { athleteProfileId: true },
    });
    if (!ta) throwMatchBadRequest('Loser tournament athlete missing');

    return {
      tournamentAthleteId: loserTa,
      athleteProfileId: ta.athleteProfileId,
    };
  }

  static async createCustom(input: CreateCustomMatchDTO, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throwMatchBadRequest('Group not found');
    if (group.tournament.status === 'completed') {
      throwMatchBadRequest('Cannot add matches to a completed tournament');
    }

    const displayLabel = input.displayLabel.trim();
    await assertCustomMatchDisplayLabelAvailable({
      tournamentId: group.tournamentId,
      groupId: input.groupId,
      displayLabel,
    });

    const red = await MatchDAL.resolveCustomSlot(
      input.groupId,
      group.tournamentId,
      input.red
    );
    const blue = await MatchDAL.resolveCustomSlot(
      input.groupId,
      group.tournamentId,
      input.blue
    );

    if (red.tournamentAthleteId === blue.tournamentAthleteId) {
      throwMatchBadRequest('Red and blue cannot be the same athlete');
    }

    const idxAgg = await prisma.match.aggregate({
      where: { groupId: input.groupId, round: MATCH_CUSTOM_ROUND },
      _max: { matchIndex: true },
    });
    const nextMatchIndex = (idxAgg._max.matchIndex ?? -1) + 1;

    const row = await prisma.match.create({
      data: {
        kind: 'custom',
        displayLabel,
        groupId: input.groupId,
        tournamentId: group.tournamentId,
        round: MATCH_CUSTOM_ROUND,
        matchIndex: nextMatchIndex,
        status: 'pending',
        bestOf: input.bestOf ?? 3,
        redTournamentAthleteId: red.tournamentAthleteId,
        blueTournamentAthleteId: blue.tournamentAthleteId,
        redAthleteId: red.athleteProfileId,
        blueAthleteId: blue.athleteProfileId,
        redWins: 0,
        blueWins: 0,
        redLocked: false,
        blueLocked: false,
      },
    });

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'match.create_custom',
      entityType: 'match',
      entityId: row.id,
      payload: { groupId: input.groupId, displayLabel },
    });

    publishMatchInvalidateEvent(group.tournamentId);

    return MatchDAL.coalesceMatchRead(row);
  }
}
