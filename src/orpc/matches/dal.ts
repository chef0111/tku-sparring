import { MatchKindSchema } from './dto';
import {
  assignRound0Slot,
  setRound0SlotLock,
  swapRound0Slots,
} from './bracket/round0-slot-editor';
import { coalesceMatchRead, findMatchesByGroupId } from './match-read';
import type {
  AssignSlotDTO,
  SetLockDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
} from './dto';
import { isThirdPlaceMatch } from '@/lib/tournament/bracket-layout';
import { recordMutationActivity } from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

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

  static async setLock(input: SetLockDTO) {
    return setRound0SlotLock(input);
  }

  static async assignSlot(input: AssignSlotDTO, adminId: string) {
    return assignRound0Slot(input, adminId);
  }

  static async swapSlots(input: SwapSlotsDTO, adminId: string) {
    return swapRound0Slots(input, adminId);
  }

  static async swapParticipants(input: SwapParticipantsDTO, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        include: { group: { include: { tournament: true } } },
      });
      if (!match) throw new Error('Match not found');

      assertTournamentAction(match.group.tournament.status, 'match.slot.edit');
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
      const bracketMatch = {
        id: match.id,
        round: match.round,
        matchIndex: match.matchIndex,
        kind: MatchKindSchema.parse(match.kind),
      };

      if (
        isThirdPlaceMatch(
          bracketMatch,
          bracketRows,
          match.group.thirdPlaceMatch
        )
      ) {
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

      await recordMutationActivity(
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
}
