import type { Prisma } from '@/generated/prisma/client';
import type { GroupAssignmentStore } from '@/server/application/groups/repositories/assign';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

const UNASSIGNED_GROUP_FILTER = {
  groupId: null,
} satisfies Prisma.TournamentAthleteWhereInput;

function buildAutoAssignWhere(
  tournamentId: string,
  group: {
    gender: string | null;
    beltMin: number | null;
    beltMax: number | null;
    weightMin: number | null;
    weightMax: number | null;
  }
): Prisma.TournamentAthleteWhereInput {
  const where: Prisma.TournamentAthleteWhereInput = {
    tournamentId,
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

  return where;
}

export const groupAssignmentStore: GroupAssignmentStore = {
  async findGroup(groupId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        tournamentId: true,
        gender: true,
        beltMin: true,
        beltMax: true,
        weightMin: true,
        weightMax: true,
        tournament: { select: { status: true } },
      },
    });
    if (!group) return null;

    const { tournament, ...row } = group;
    return { ...row, tournamentStatus: tournament.status };
  },

  async findTournamentAthlete(id) {
    return prisma.tournamentAthlete.findUnique({
      where: { id },
      select: { id: true, tournamentId: true },
    });
  },

  async assignAthlete(input) {
    const updated = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: input.groupId },
        include: { tournament: { select: { status: true } } },
      });
      if (!group) throw new NotFoundError('Group not found');
      assertTournamentAction(group.tournament.status, 'group.assignAthlete');

      const row = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { groupId: input.groupId, status: 'assigned' },
      });

      await recordMutationActivity(
        {
          tournamentId: row.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
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
  },

  async unassignAthlete(input) {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.tournamentAthlete.findUnique({
        where: { id: input.tournamentAthleteId },
        include: { tournament: { select: { status: true } } },
      });
      if (!current) throw new NotFoundError('Tournament athlete not found');
      assertTournamentAction(current.tournament.status, 'group.assignAthlete');

      const row = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { groupId: null, status: 'selected' },
      });

      await recordMutationActivity(
        {
          tournamentId: row.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
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
  },

  async autoAssign(input) {
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: input.groupId },
        include: { tournament: { select: { status: true } } },
      });
      if (!group) throw new NotFoundError('Group not found');
      assertTournamentAction(group.tournament.status, 'group.autoAssign');

      const unassigned = await tx.tournamentAthlete.findMany({
        where: buildAutoAssignWhere(input.tournamentId, group),
      });
      if (unassigned.length === 0) {
        return { assigned: 0, tournamentId: input.tournamentId };
      }

      await tx.tournamentAthlete.updateMany({
        where: { id: { in: unassigned.map((a) => a.id) } },
        data: { groupId: input.groupId, status: 'assigned' },
      });

      await recordMutationActivity(
        {
          tournamentId: input.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
          entityType: 'group',
          entityId: input.groupId,
          payload: { count: unassigned.length },
        },
        tx
      );

      return { assigned: unassigned.length, tournamentId: input.tournamentId };
    });

    publishTournamentMutation(result.tournamentId);
    return { assigned: result.assigned };
  },

  async autoAssignAll(command) {
    const result = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: command.tournamentId },
        select: { status: true },
      });
      if (!tournament) throw new NotFoundError('Tournament not found');
      assertTournamentAction(tournament.status, 'group.autoAssign');

      const groups = await tx.group.findMany({
        where: { tournamentId: command.tournamentId },
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
        const unassigned = await tx.tournamentAthlete.findMany({
          where: buildAutoAssignWhere(command.tournamentId, group),
        });
        if (unassigned.length === 0) continue;

        await tx.tournamentAthlete.updateMany({
          where: { id: { in: unassigned.map((a) => a.id) } },
          data: { groupId: group.id, status: 'assigned' },
        });

        await recordMutationActivity(
          {
            tournamentId: command.tournamentId,
            adminId: command.adminId,
            eventType: 'group.auto_assign',
            entityType: 'group',
            entityId: group.id,
            payload: { count: unassigned.length },
          },
          tx
        );

        assigned += unassigned.length;
      }

      return { assigned, groupsRun, groupsSkipped };
    });

    publishTournamentMutation(command.tournamentId);
    return result;
  },

  async findTournament(tournamentId) {
    return prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true },
    });
  },
};
