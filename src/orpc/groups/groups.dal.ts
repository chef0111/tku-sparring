import type {
  AssignAthleteDTO,
  AutoAssignDTO,
  CreateGroupDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from './groups.dto';
import { prisma } from '@/lib/db';

export async function findByTournamentId(tournamentId: string) {
  return prisma.group.findMany({
    where: { tournamentId },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { tournamentAthletes: true, matches: true } },
    },
  });
}

export async function findById(id: string) {
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

export async function create(data: CreateGroupDTO) {
  return prisma.group.create({ data });
}

export async function update(id: string, data: Omit<UpdateGroupDTO, 'id'>) {
  return prisma.group.update({ where: { id }, data });
}

export async function deleteGroup(id: string) {
  return prisma.group.delete({ where: { id } });
}

export async function autoAssign(input: AutoAssignDTO) {
  const group = await prisma.group.findUnique({ where: { id: input.groupId } });
  if (!group) throw new Error('Group not found');

  const where: Record<string, unknown> = {
    tournamentId: input.tournamentId,
    groupId: null,
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

  const unassigned = await prisma.tournamentAthlete.findMany({ where });

  if (unassigned.length === 0) return { assigned: 0 };

  await prisma.tournamentAthlete.updateMany({
    where: { id: { in: unassigned.map((a) => a.id) } },
    data: { groupId: input.groupId, status: 'assigned' },
  });

  return { assigned: unassigned.length };
}

export async function assignAthlete(input: AssignAthleteDTO) {
  return prisma.tournamentAthlete.update({
    where: { id: input.tournamentAthleteId },
    data: { groupId: input.groupId, status: 'assigned' },
  });
}

export async function unassignAthlete(input: UnassignAthleteDTO) {
  return prisma.tournamentAthlete.update({
    where: { id: input.tournamentAthleteId },
    data: { groupId: null, status: 'selected' },
  });
}
