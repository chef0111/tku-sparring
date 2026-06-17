import type { MatchParticipantStore } from '@/server/application/matches/repositories/swap-participants';
import type { Prisma } from '@/generated/prisma/client';
import { isThirdPlaceMatch } from '@/lib/tournament/bracket/bracket-layout';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { matchKindFromDb } from '@/server/domain/tournament/match/match-kind';
import { coalesceMatchRead } from '@/server/domain/tournament/match/match-read';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

export const matchParticipantStore: MatchParticipantStore = {
  async findMatch(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { status: true } } },
    });
    if (!match) return null;

    const { tournament, ...row } = match;
    return { ...coalesceMatchRead(row), tournamentStatus: tournament.status };
  },

  async swap(input) {
    const { command, activity } = input;

    const result = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: command.matchId },
        include: { group: { include: { tournament: true } } },
      });
      if (!match) throw new NotFoundError('Match not found');

      if (match.status === 'complete') {
        throw new BadRequestError(
          'Cannot swap participants on a complete match'
        );
      }
      if (match.round === 0) {
        throw new BadRequestError('Use slot swap for opening-round matches');
      }
      if (match.redLocked || match.blueLocked) {
        throw new BadRequestError('Cannot swap a locked corner');
      }
      if (match.kind === 'custom') {
        throw new BadRequestError('Cannot swap corners on custom matches');
      }

      const bracketRows = await tx.match.findMany({
        where: { groupId: match.groupId, kind: 'bracket' },
        select: { id: true, round: true, matchIndex: true, kind: true },
      });
      const bracketMatch = {
        id: match.id,
        round: match.round,
        matchIndex: match.matchIndex,
        kind: matchKindFromDb(match.kind),
      };

      if (
        isThirdPlaceMatch(
          bracketMatch,
          bracketRows,
          match.group.thirdPlaceMatch
        )
      ) {
        throw new BadRequestError(
          'Cannot swap corners on the third-place match'
        );
      }

      if (
        command.redTournamentAthleteId !== match.blueTournamentAthleteId ||
        command.blueTournamentAthleteId !== match.redTournamentAthleteId
      ) {
        throw new BadRequestError('Swap must transpose red and blue corners');
      }

      const redAthlete = command.redTournamentAthleteId
        ? await tx.tournamentAthlete.findUnique({
            where: { id: command.redTournamentAthleteId },
          })
        : null;
      const blueAthlete = command.blueTournamentAthleteId
        ? await tx.tournamentAthlete.findUnique({
            where: { id: command.blueTournamentAthleteId },
          })
        : null;

      const updated = await tx.match.update({
        where: { id: command.matchId },
        data: {
          redTournamentAthleteId: command.redTournamentAthleteId,
          blueTournamentAthleteId: command.blueTournamentAthleteId,
          redAthleteId: redAthlete?.athleteProfileId ?? null,
          blueAthleteId: blueAthlete?.athleteProfileId ?? null,
          cornersSwapped: !match.cornersSwapped,
        },
      });

      await recordMutationActivity(
        {
          tournamentId: match.tournamentId,
          adminId: command.adminId,
          eventType: activity.eventType,
          entityType: 'match',
          entityId: command.matchId,
          payload: activity.payload as Prisma.InputJsonValue | undefined,
        },
        tx
      );

      return { updated, tournamentId: match.tournamentId };
    });

    publishTournamentMutation(result.tournamentId);
    return coalesceMatchRead(result.updated);
  },
};
