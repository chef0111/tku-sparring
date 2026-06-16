import type { AssignAthleteDTO, UnassignAthleteDTO } from './dto';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { badRequest, notFound } from '@/orpc/errors';
import { prisma } from '@/lib/db';

export async function assignAthleteToGroup(
  input: AssignAthleteDTO & { adminId: string }
) {
  const updated = await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: input.groupId },
      select: { id: true, tournamentId: true },
    });
    if (!group) notFound('Group not found');

    const current = await tx.tournamentAthlete.findUnique({
      where: { id: input.tournamentAthleteId },
      select: { id: true, tournamentId: true },
    });
    if (!current) notFound('Tournament athlete not found');
    if (current.tournamentId !== group.tournamentId) {
      badRequest('Athlete does not belong to this tournament');
    }

    const row = await tx.tournamentAthlete.update({
      where: { id: input.tournamentAthleteId },
      data: { groupId: input.groupId, status: 'assigned' },
    });

    await recordMutationActivity(
      {
        tournamentId: row.tournamentId,
        adminId: input.adminId,
        eventType: 'group.athlete_assigned',
        entityType: 'tournament_athlete',
        entityId: row.id,
        payload: {
          groupId: input.groupId,
          name: row.name,
        },
      },
      tx
    );

    return row;
  });

  publishTournamentMutation(updated.tournamentId);
  return updated;
}

export async function unassignAthleteFromGroup(
  input: UnassignAthleteDTO & { adminId: string }
) {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.tournamentAthlete.findUnique({
      where: { id: input.tournamentAthleteId },
    });
    if (!current) notFound('Tournament athlete not found');

    const row = await tx.tournamentAthlete.update({
      where: { id: input.tournamentAthleteId },
      data: { groupId: null, status: 'selected' },
    });

    await recordMutationActivity(
      {
        tournamentId: row.tournamentId,
        adminId: input.adminId,
        eventType: 'group.athlete_unassigned',
        entityType: 'tournament_athlete',
        entityId: row.id,
        payload: {
          previousGroupId: current.groupId,
          name: row.name,
        },
      },
      tx
    );

    return row;
  });

  publishTournamentMutation(updated.tournamentId);
  return updated;
}
