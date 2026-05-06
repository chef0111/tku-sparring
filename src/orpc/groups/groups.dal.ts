import type { CreateGroupDTO, UpdateGroupDTO } from './groups.dto';
import { prisma } from '@/lib/db';

export class GroupDAL {
  static async findByTournamentId(tournamentId: string) {
    return await prisma.group.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    });
  }

  static async findById(id: string) {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        tournamentAthletes: true,
        matches: true,
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    });
  }

  static async create(data: CreateGroupDTO) {
    return await prisma.group.create({ data });
  }

  static async update(id: string, data: Omit<UpdateGroupDTO, 'id'>) {
    return await prisma.group.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return await prisma.group.delete({ where: { id } });
  }
}

export const findByTournamentId = (
  ...args: Parameters<typeof GroupDAL.findByTournamentId>
) => GroupDAL.findByTournamentId(...args);

export const findById = (...args: Parameters<typeof GroupDAL.findById>) =>
  GroupDAL.findById(...args);

export const create = (...args: Parameters<typeof GroupDAL.create>) =>
  GroupDAL.create(...args);

export const update = (...args: Parameters<typeof GroupDAL.update>) =>
  GroupDAL.update(...args);

export const deleteGroup = (...args: Parameters<typeof GroupDAL.delete>) =>
  GroupDAL.delete(...args);
