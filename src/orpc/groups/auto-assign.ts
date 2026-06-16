import type { Prisma } from '@/generated/prisma/client';
import type { AutoAssignDTO } from './dto';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { notFound } from '@/orpc/errors';
import { prisma } from '@/lib/db';
import { assertTournamentAction } from '@/orpc/policies/tournament-policy';

const UNASSIGNED_GROUP_FILTER = {
  groupId: null,
} satisfies Prisma.TournamentAthleteWhereInput;

export async function autoAssignGroup(
  input: AutoAssignDTO & { adminId: string }
) {
  const result = await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: input.groupId },
      include: { tournament: { select: { status: true } } },
    });
    if (!group) notFound('Group not found');
    assertTournamentAction(group.tournament.status, 'group.autoAssign');

    const where: Prisma.TournamentAthleteWhereInput = {
      tournamentId: input.tournamentId,
      AND: [UNASSIGNED_GROUP_FILTER],
    };

    if (group.gender) where.gender = group.gender;
    if (group.beltMin != null || group.beltMax != null) {
      where.beltLevel = {
        ...(group.beltMin != null ? { gte: group.beltMin } : {}),
        ...(group.beltMax != null ? { lte: group.beltMax } : {}),
      };
    }
    if (group.weightMin != null || group.weightMax != null) {
      where.weight = {
        ...(group.weightMin != null ? { gte: group.weightMin } : {}),
        ...(group.weightMax != null ? { lte: group.weightMax } : {}),
      };
    }

    const unassigned = await tx.tournamentAthlete.findMany({ where });
    if (unassigned.length === 0) return { assigned: 0 };

    await tx.tournamentAthlete.updateMany({
      where: { id: { in: unassigned.map((a) => a.id) } },
      data: { groupId: input.groupId, status: 'assigned' },
    });

    await recordMutationActivity(
      {
        tournamentId: input.tournamentId,
        adminId: input.adminId,
        eventType: 'group.auto_assign',
        entityType: 'group',
        entityId: input.groupId,
        payload: { count: unassigned.length },
      },
      tx
    );

    return { assigned: unassigned.length };
  });

  publishTournamentMutation(input.tournamentId);
  return result;
}

export async function autoAssignAllEligible(input: {
  tournamentId: string;
  adminId: string;
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
    select: { status: true },
  });
  if (!tournament) notFound('Tournament not found');
  assertTournamentAction(tournament.status, 'group.autoAssign');

  const groups = await prisma.group.findMany({
    where: { tournamentId: input.tournamentId },
    include: { _count: { select: { matches: true } } },
  });

  let assigned = 0;
  let groupsRun = 0;
  let groupsSkipped = 0;

  for (const group of groups) {
    if (group._count.matches > 0) {
      groupsSkipped += 1;
      continue;
    }
    groupsRun += 1;
    const result = await autoAssignGroup({
      tournamentId: input.tournamentId,
      groupId: group.id,
      adminId: input.adminId,
    });
    assigned += result.assigned;
  }

  return { assigned, groupsRun, groupsSkipped };
}
