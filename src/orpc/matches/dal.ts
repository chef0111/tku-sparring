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
import type {
  AdminSetMatchStatusDTO,
  AssignSlotDTO,
  CreateMatchDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateMatchDTO,
  UpdateScoreDTO,
} from './dto';
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

function clearMatchProgressionData() {
  return {
    redTournamentAthleteId: null,
    blueTournamentAthleteId: null,
    redAthleteId: null,
    blueAthleteId: null,
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    winnerTournamentAthleteId: null,
    status: 'pending' as const,
  };
}

export class MatchDAL {
  static async findByGroupId(groupId: string) {
    return prisma.match.findMany({
      where: { groupId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
  }

  static async findByTournamentId(tournamentId: string) {
    return prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
  }

  static async findById(id: string) {
    return prisma.match.findUnique({ where: { id } });
  }

  static async create(data: CreateMatchDTO) {
    return prisma.match.create({ data });
  }

  static async update(id: string, data: Omit<UpdateMatchDTO, 'id'>) {
    return prisma.match.update({ where: { id }, data });
  }

  static async deleteMatch(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  /** Uniform random permutation (Math.random). */
  private static shuffleAthletePool<T>(items: Array<T>): Array<T> {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
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
      where: { groupId: input.groupId },
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

    await prisma.match.updateMany({
      where: { groupId },
      data: {
        redTournamentAthleteId: null,
        blueTournamentAthleteId: null,
        redAthleteId: null,
        blueAthleteId: null,
        redWins: 0,
        blueWins: 0,
        winnerId: null,
        winnerTournamentAthleteId: null,
        status: 'pending',
        redLocked: false,
        blueLocked: false,
      },
    });

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

  static async shuffleBracket(groupId: string, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Shuffle only allowed in Draft status');
    }

    const allMatches = await prisma.match.findMany({
      where: { groupId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    if (allMatches.length === 0) {
      throw new Error('No bracket yet. Generate a bracket first.');
    }

    const athletes = await prisma.tournamentAthlete.findMany({
      where: { groupId },
      orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
    });

    const lockedIds = new Set<string>();
    const round0 = allMatches.filter((m) => m.round === 0);
    round0.sort((a, b) => a.matchIndex - b.matchIndex);

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

    const pool = athletes.filter((a) => !lockedIds.has(a.id));
    const shuffled = MatchDAL.shuffleAthletePool(pool);

    const placementAthletes = athletes.map((a) => ({
      id: a.id,
      athleteProfileId: a.athleteProfileId,
    }));

    const round0ForPlan = round0.map((m) => ({
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

    for (const update of placementPlan.updates) {
      await prisma.match.update({
        where: { id: update.matchId },
        data: update.data,
      });
    }

    const higher = allMatches.filter((m) => m.round >= 1);
    const clearData = clearMatchProgressionData();
    for (const m of higher) {
      await prisma.match.update({
        where: { id: m.id },
        data: clearData,
      });
    }

    await applyRound0ByeAdvancement(groupId, group.tournamentId);

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

    await prisma.match.deleteMany({ where: { groupId } });

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.regenerate',
      entityType: 'group',
      entityId: groupId,
      payload: {},
    });

    return MatchDAL.generateBracket({ groupId }, adminId, {
      skipActivity: true,
    });
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

    return updated;
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

    return updated;
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

      return updated;
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

    const updated = await prisma.match.update({
      where: { id: input.matchId },
      data: transition.data,
    });

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

    return updated;
  }
}
