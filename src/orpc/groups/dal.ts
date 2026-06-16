import {
  autoAssignGroup,
  autoAssignAllEligible as runAutoAssignAllEligible,
} from './auto-assign';
import {
  assignAthleteToGroup,
  unassignAthleteFromGroup,
} from './assign-athlete';
import type {
  AssignAthleteDTO,
  AutoAssignDTO,
  CreateGroupDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from './dto';
import { prisma } from '@/lib/db';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-realtime-broadcast';

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
