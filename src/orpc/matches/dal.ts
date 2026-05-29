import { MatchStatusSchema } from './dto';
import { advanceWinner, clearWinnerAdvancement } from './match-progression';
import {
  assignRound0Slot,
  setRound0SlotLock,
  swapRound0Slots,
} from './bracket/round0-slot-editor';
import { assertLabelAvailable } from './custom-match-label';
import { throwMatchBadRequest } from './match-domain-error';
import { coalesceMatchRead, findMatchesByGroupId } from './match-read';
import type {
  AdminSetMatchStatusDTO,
  AssignSlotDTO,
  CreateCustomMatchDTO,
  CreateMatchDTO,
  CustomSlotDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateMatchDTO,
  UpdateScoreDTO,
} from './dto';
import {
  getAdminStatusTransition,
  getScoreTransition,
  getWinnerOverrideTransition,
} from '@/lib/tournament/match-transition';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { publishMatchInvalidateEvent } from '@/lib/tournament/tournament-sse-bus';
import { prisma } from '@/lib/db';

const MATCH_CUSTOM_ROUND = 900;

export class MatchDAL {
  static async findByGroupId(groupId: string) {
    return findMatchesByGroupId(groupId);
  }

  static async findByTournamentId(tournamentId: string) {
    const rows = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    return rows.map((m) => coalesceMatchRead(m));
  }

  static async findById(id: string) {
    const m = await prisma.match.findUnique({ where: { id } });
    if (!m) return null;
    return coalesceMatchRead(m);
  }

  static async create(data: CreateMatchDTO) {
    const m = await prisma.match.create({ data });
    return coalesceMatchRead(m);
  }

  static async update(id: string, data: Omit<UpdateMatchDTO, 'id'>) {
    const m = await prisma.match.update({ where: { id }, data });
    return coalesceMatchRead(m);
  }

  static async deleteMatch(id: string) {
    const m = await prisma.match.delete({ where: { id } });
    return coalesceMatchRead(m);
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

    if (transition.data.status === 'complete' && transition.advancedWinnerId) {
      await advanceWinner(input.matchId, transition.advancedWinnerId);
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

    return coalesceMatchRead(updated);
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

    if (transition.advancedWinnerId)
      await advanceWinner(input.matchId, transition.advancedWinnerId);

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

    return coalesceMatchRead(updated);
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
            previousRedAthleteId: match.redTournamentAthleteId,
            previousBlueAthleteId: match.blueTournamentAthleteId,
            redTournamentAthleteId: input.redTournamentAthleteId,
            blueTournamentAthleteId: input.blueTournamentAthleteId,
          },
        },
        tx
      );

      return coalesceMatchRead(updated);
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
            tournamentWinnerId: scoreTransition.data.tournamentWinnerId ?? null,
            status: 'complete',
          },
        });

        if (scoreTransition.advancedWinnerId) {
          await advanceWinner(input.matchId, scoreTransition.advancedWinnerId);
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

    return coalesceMatchRead(updated);
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
    if (!feeder.tournamentWinnerId) {
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
        where: { id: feeder.tournamentWinnerId },
        select: { athleteProfileId: true },
      });
      if (!ta) throwMatchBadRequest('Winner tournament athlete missing');
      return {
        tournamentAthleteId: feeder.tournamentWinnerId,
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
    const w = feeder.tournamentWinnerId;
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
    await assertLabelAvailable({
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

    return coalesceMatchRead(row);
  }
}
