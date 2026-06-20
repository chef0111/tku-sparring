import type { Prisma } from '@/generated/prisma/client';
import type { DivisionAssignmentStore } from '@/server/application/divisions/repositories/assign';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

const UNASSIGNED_DIVISION_FILTER = {
  divisionId: null,
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
    AND: [UNASSIGNED_DIVISION_FILTER],
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

export const divisionAssignmentStore: DivisionAssignmentStore = {
  async findDivision(divisionId) {
    const group = await prisma.division.findUnique({
      where: { id: divisionId },
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
      const group = await tx.division.findUnique({
        where: { id: input.divisionId },
        include: { tournament: { select: { status: true } } },
      });
      if (!group) throw new NotFoundError('Division not found');
      assertTournamentAction(group.tournament.status, 'division.assignAthlete');

      const row = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { divisionId: input.divisionId, status: 'assigned' },
      });

      await recordMutationActivity(
        {
          tournamentId: row.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
          entityType: 'tournament_athlete',
          entityId: row.id,
          payload: {
            divisionId: input.divisionId,
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
      assertTournamentAction(
        current.tournament.status,
        'division.assignAthlete'
      );

      const row = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { divisionId: null, status: 'selected' },
      });

      await recordMutationActivity(
        {
          tournamentId: row.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
          entityType: 'tournament_athlete',
          entityId: row.id,
          payload: {
            previousDivisionId: current.divisionId,
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
      const group = await tx.division.findUnique({
        where: { id: input.divisionId },
        include: { tournament: { select: { status: true } } },
      });
      if (!group) throw new NotFoundError('Division not found');
      assertTournamentAction(group.tournament.status, 'division.autoAssign');

      const unassigned = await tx.tournamentAthlete.findMany({
        where: buildAutoAssignWhere(input.tournamentId, group),
      });
      if (unassigned.length === 0) {
        return { assigned: 0, tournamentId: input.tournamentId };
      }

      await tx.tournamentAthlete.updateMany({
        where: { id: { in: unassigned.map((a) => a.id) } },
        data: { divisionId: input.divisionId, status: 'assigned' },
      });

      await recordMutationActivity(
        {
          tournamentId: input.tournamentId,
          adminId: input.adminId,
          eventType: input.activity.eventType,
          entityType: 'division',
          entityId: input.divisionId,
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
      assertTournamentAction(tournament.status, 'division.autoAssign');

      const groups = await tx.division.findMany({
        where: { tournamentId: command.tournamentId },
        include: { _count: { select: { matches: true } } },
      });

      let assigned = 0;
      let divisionsRun = 0;
      let divisionsSkipped = 0;

      for (const group of groups) {
        if (group._count.matches > 0) {
          divisionsSkipped += 1;
          continue;
        }

        divisionsRun += 1;
        const unassigned = await tx.tournamentAthlete.findMany({
          where: buildAutoAssignWhere(command.tournamentId, group),
        });
        if (unassigned.length === 0) continue;

        await tx.tournamentAthlete.updateMany({
          where: { id: { in: unassigned.map((a) => a.id) } },
          data: { divisionId: group.id, status: 'assigned' },
        });

        await recordMutationActivity(
          {
            tournamentId: command.tournamentId,
            adminId: command.adminId,
            eventType: 'division.auto_assign',
            entityType: 'division',
            entityId: group.id,
            payload: { count: unassigned.length },
          },
          tx
        );

        assigned += unassigned.length;
      }

      return { assigned, divisionsRun, divisionsSkipped };
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
