import { assertLabelAvailable } from 'src/server/infrastructure/matches/repositories/custom/assert-label';
import { resolveCustomSlot } from 'src/server/infrastructure/matches/repositories/custom/resolve-slot';
import type { CustomMatchStore } from '@/server/application/matches/repositories/custom';
import type { Prisma } from '@/generated/prisma/client';
import { BadRequestError } from '@/server/application/errors';
import { CustomMatchValidationError } from '@/server/domain/tournament/custom/errors';
import { coalesceMatchRead } from '@/server/domain/tournament/match/match-read';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

const CUSTOM_MATCH_ROUND = 900;

function mapValidationError(e: unknown): never {
  if (e instanceof CustomMatchValidationError) {
    throw new BadRequestError(e.message);
  }
  throw e;
}

export const customMatchStore: CustomMatchStore = {
  async findGroup(groupId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { status: true } } },
    });
    if (!group) return null;

    return {
      id: group.id,
      tournamentId: group.tournamentId,
      tournamentStatus: group.tournament.status,
    };
  },

  async findForDelete(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { status: true } } },
    });
    if (!match) return null;

    const { tournament, ...row } = match;
    return { ...row, tournamentStatus: tournament.status };
  },

  async create(input) {
    const { command, group, activity } = input;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const displayLabel = command.displayLabel.trim();
        await assertLabelAvailable(
          {
            tournamentId: group.tournamentId,
            groupId: command.groupId,
            displayLabel,
          },
          tx
        );

        const red = await resolveCustomSlot(command.groupId, command.red, tx);
        const blue = await resolveCustomSlot(command.groupId, command.blue, tx);

        if (red.tournamentAthleteId === blue.tournamentAthleteId) {
          throw new BadRequestError('Red and blue cannot be the same athlete');
        }

        const idxAgg = await tx.match.aggregate({
          where: { groupId: command.groupId, round: CUSTOM_MATCH_ROUND },
          _max: { matchIndex: true },
        });
        const nextMatchIndex = (idxAgg._max.matchIndex ?? -1) + 1;

        const row = await tx.match.create({
          data: {
            kind: 'custom',
            displayLabel,
            groupId: command.groupId,
            tournamentId: group.tournamentId,
            round: CUSTOM_MATCH_ROUND,
            matchIndex: nextMatchIndex,
            status: 'pending',
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

        await recordMutationActivity(
          {
            tournamentId: group.tournamentId,
            adminId: command.adminId,
            eventType: activity.eventType,
            entityType: 'match',
            entityId: row.id,
            payload: activity.payload as Prisma.InputJsonValue | undefined,
          },
          tx
        );

        return { row, tournamentId: group.tournamentId };
      });

      publishTournamentMutation(result.tournamentId);
      return coalesceMatchRead(result.row);
    } catch (e) {
      mapValidationError(e);
    }
  },

  async delete(input) {
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.match.delete({ where: { id: input.matchId } });

      await recordMutationActivity(
        {
          tournamentId: deleted.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
          entityType: 'match',
          entityId: input.matchId,
          payload: input.activity.payload as Prisma.InputJsonValue | undefined,
        },
        tx
      );

      return { deleted, tournamentId: deleted.tournamentId };
    });

    publishTournamentMutation(result.tournamentId);
    return coalesceMatchRead(result.deleted);
  },
};
