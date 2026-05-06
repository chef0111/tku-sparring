import type {
  CreateTournamentDTO,
  UpdateTournamentDTO,
} from './tournaments.dto';
import { prisma } from '@/lib/db';

export class TournamentDAL {
  static async findMany() {
    return await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { groups: true, matches: true, tournamentAthletes: true },
        },
      },
    });
  }

  static async findById(id: string) {
    return await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            _count: { select: { tournamentAthletes: true, matches: true } },
          },
        },
        _count: {
          select: { groups: true, matches: true, tournamentAthletes: true },
        },
      },
    });
  }

  static async create(data: CreateTournamentDTO) {
    return await prisma.tournament.create({ data });
  }

  static async update(id: string, data: Omit<UpdateTournamentDTO, 'id'>) {
    return await prisma.tournament.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return await prisma.tournament.delete({ where: { id } });
  }
}

export const findMany = (...args: Parameters<typeof TournamentDAL.findMany>) =>
  TournamentDAL.findMany(...args);

export const findById = (...args: Parameters<typeof TournamentDAL.findById>) =>
  TournamentDAL.findById(...args);

export const create = (...args: Parameters<typeof TournamentDAL.create>) =>
  TournamentDAL.create(...args);

export const update = (...args: Parameters<typeof TournamentDAL.update>) =>
  TournamentDAL.update(...args);

export const deleteTournament = (
  ...args: Parameters<typeof TournamentDAL.delete>
) => TournamentDAL.delete(...args);
