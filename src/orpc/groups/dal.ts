import type { Prisma } from '@prisma/client';
import type {
  AssignAthleteDTO,
  AutoAssignDTO,
  CreateGroupDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from './dto';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

export class GroupDAL {
  private static readonly UNASSIGNED_GROUP_FILTER = {
    OR: [{ groupId: null }, { groupId: { isSet: false } }],
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
    return prisma.group.create({ data });
  }

  static async update(id: string, data: Omit<UpdateGroupDTO, 'id'>) {
    return prisma.group.update({ where: { id }, data });
  }

  static async deleteGroup(id: string) {
    return prisma.group.delete({ where: { id } });
  }

  static async autoAssign(input: AutoAssignDTO & { adminId: string }) {
    return prisma.$transaction(async (tx) => {
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
  }

  static async assignAthlete(input: AssignAthleteDTO & { adminId: string }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { groupId: input.groupId, status: 'assigned' },
      });

      await recordTournamentActivity(
        {
          tournamentId: updated.tournamentId,
          adminId: input.adminId,
          eventType: 'group.athlete_assigned',
          entityType: 'tournament_athlete',
          entityId: updated.id,
          payload: {
            groupId: input.groupId,
            name: updated.name,
          },
        },
        tx
      );

      return updated;
    });
  }

  static async unassignAthlete(
    input: UnassignAthleteDTO & { adminId: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.tournamentAthlete.findUnique({
        where: { id: input.tournamentAthleteId },
      });
      if (!current) {
        throw new Error('Tournament athlete not found');
      }

      const updated = await tx.tournamentAthlete.update({
        where: { id: input.tournamentAthleteId },
        data: { groupId: null, status: 'selected' },
      });

      await recordTournamentActivity(
        {
          tournamentId: updated.tournamentId,
          adminId: input.adminId,
          eventType: 'group.athlete_unassigned',
          entityType: 'tournament_athlete',
          entityId: updated.id,
          payload: {
            previousGroupId: current.groupId,
            name: updated.name,
          },
        },
        tx
      );

      return updated;
    });
  }
}
