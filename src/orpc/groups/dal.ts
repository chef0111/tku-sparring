import type { Prisma } from '@/generated/prisma/client';
import type {
  AssignAthleteDTO,
  AutoAssignDTO,
  CreateGroupDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from './dto';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-sse-bus';

export class GroupDAL {
  private static readonly UNASSIGNED_GROUP_FILTER = {
    groupId: null,
  } satisfies Prisma.TournamentAthleteWhereInput;

  static async findByTournamentId(tournamentId: string) {
    return prisma.group.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    });
  }

  static async findById(id: string) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        tournamentAthletes: {
          include: {
            athleteProfile: { select: { id: true, athleteCode: true } },
          },
        },
        matches: true,
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    });
  }

  static async create(data: CreateGroupDTO) {
    const created = await prisma.group.create({ data });
    publishSelectionInvalidate(created.tournamentId);
    return created;
  }

  static async update(id: string, data: Omit<UpdateGroupDTO, 'id'>) {
    const updated = await prisma.group.update({ where: { id }, data });
    publishSelectionInvalidate(updated.tournamentId);
    return updated;
  }

  static async deleteGroup(id: string) {
    const existing = await prisma.group.findUnique({
      where: { id },
      select: { tournamentId: true },
    });
    if (!existing) {
      throw new Error('Group not found');
    }
    const deleted = await prisma.group.delete({ where: { id } });
    publishSelectionInvalidate(existing.tournamentId);
    return deleted;
  }

  static async autoAssign(input: AutoAssignDTO & { adminId: string }) {
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: input.groupId },
      });
      if (!group) throw new Error('Group not found');

      const where: Prisma.TournamentAthleteWhereInput = {
        tournamentId: input.tournamentId,
        AND: [GroupDAL.UNASSIGNED_GROUP_FILTER],
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

      await recordTournamentActivity(
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
    publishSelectionInvalidate(input.tournamentId);
    return result;
  }

  static async autoAssignAllEligible(input: {
    tournamentId: string;
    adminId: string;
  }) {
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
      const result = await GroupDAL.autoAssign({
        tournamentId: input.tournamentId,
        groupId: group.id,
        adminId: input.adminId,
      });
      assigned += result.assigned;
    }

    return { assigned, groupsRun, groupsSkipped };
  }

  static async assignAthlete(input: AssignAthleteDTO & { adminId: string }) {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { groupId: input.groupId, status: 'assigned' },
      });

      await recordTournamentActivity(
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
    publishSelectionInvalidate(updated.tournamentId);
    return updated;
  }

  static async unassignAthlete(
    input: UnassignAthleteDTO & { adminId: string }
  ) {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.tournamentAthlete.findUnique({
        where: { id: input.tournamentAthleteId },
      });
      if (!current) {
        throw new Error('Tournament athlete not found');
      }

      const row = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { groupId: null, status: 'selected' },
      });

      await recordTournamentActivity(
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
    publishSelectionInvalidate(updated.tournamentId);
    return updated;
  }
}
