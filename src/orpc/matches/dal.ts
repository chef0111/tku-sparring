import { MatchStatusSchema } from './dto';
import {
  assignRound0Slot,
  setRound0SlotLock,
  swapRound0Slots,
} from './bracket/round0-slot-editor';
import { throwMatchBadRequest } from './match-domain-error';
import { coalesceMatchRead, findMatchesByGroupId } from './match-read';
import { applyMatchTransition } from './match-transition-write';
import type {
  AdminSetMatchStatusDTO,
  AssignSlotDTO,
  CreateMatchDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateMatchDTO,
  UpdateScoreDTO,
} from './dto';
import { isThirdPlaceMatch } from '@/lib/tournament/bracket-layout';
import {
  buildAdminStatusPlan,
  buildScoreTransitionPlan,
  buildWinnerOverridePlan,
} from '@/lib/tournament/match-transition';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

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

    const plan = buildScoreTransitionPlan({
      match,
      redWins: input.redWins,
      blueWins: input.blueWins,
    });

    return applyMatchTransition({
      matchId: input.matchId,
      plan,
      adminId,
      activity: {
        eventType: 'match.score_edit',
        payload: {
          redWins: input.redWins,
          blueWins: input.blueWins,
          status: plan.data.status,
        },
      },
    });
  }

  static async setWinner(input: SetWinnerDTO, adminId: string) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
    });
    if (!match) throw new Error('Match not found');

    const plan = buildWinnerOverridePlan({
      match,
      winnerSide: input.winnerSide,
    });

    return applyMatchTransition({
      matchId: input.matchId,
      plan,
      adminId,
      activity: {
        eventType: 'match.winner_override',
        payload: {
          winnerSide: input.winnerSide,
          reason: input.reason,
        },
      },
    });
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
      if (match.status === 'complete') {
        throw new Error('Cannot swap participants on a complete match');
      }
      if (match.round === 0) {
        throw new Error('Use slot swap for opening-round matches');
      }
      if (match.redLocked || match.blueLocked) {
        throw new Error('Cannot swap a locked corner');
      }
      if (match.kind === 'custom') {
        throw new Error('Cannot swap corners on custom matches');
      }

      const bracketRows = await tx.match.findMany({
        where: { groupId: match.groupId, kind: 'bracket' },
        select: { id: true, round: true, matchIndex: true, kind: true },
      });
      if (isThirdPlaceMatch(match, bracketRows, match.group.thirdPlaceMatch)) {
        throw new Error('Cannot swap corners on the third-place match');
      }

      if (
        input.redTournamentAthleteId !== match.blueTournamentAthleteId ||
        input.blueTournamentAthleteId !== match.redTournamentAthleteId
      ) {
        throw new Error('Swap must transpose red and blue corners');
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
          cornersSwapped: !match.cornersSwapped,
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
    const plan = buildAdminStatusPlan({ match, status: input.status });

    return applyMatchTransition({
      matchId: input.matchId,
      plan,
      adminId,
      activity: {
        eventType: 'match.status_admin',
        payload: {
          fromStatus: current,
          toStatus: input.status,
          clearedScores: plan.clearedScores,
        },
      },
    });
  }
}
