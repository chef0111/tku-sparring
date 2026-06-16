import {
  autoAssignGroup,
  autoAssignAllEligible as runAutoAssignAllEligible,
} from './auto-assign';
import {
  assignAthleteToGroup,
  unassignAthleteFromGroup,
} from './assign-athlete';
import { createGroup, deleteGroup, updateGroup } from './group-lifecycle';
import type {
  AssignAthleteDTO,
  AutoAssignDTO,
  CreateGroupDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from './dto';
import { prisma } from '@/lib/db';

export class GroupDAL {
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
    return createGroup(data);
  }

  static async update(id: string, data: Omit<UpdateGroupDTO, 'id'>) {
    return updateGroup(id, data);
  }

  static async deleteGroup(id: string) {
    return deleteGroup(id);
  }

  static async autoAssign(input: AutoAssignDTO & { adminId: string }) {
    return autoAssignGroup(input);
  }

  static async autoAssignAllEligible(input: {
    tournamentId: string;
    adminId: string;
  }) {
    return runAutoAssignAllEligible(input);
  }

  static async assignAthlete(input: AssignAthleteDTO & { adminId: string }) {
    return assignAthleteToGroup(input);
  }

  static async unassignAthlete(
    input: UnassignAthleteDTO & { adminId: string }
  ) {
    return unassignAthleteFromGroup(input);
  }
}
