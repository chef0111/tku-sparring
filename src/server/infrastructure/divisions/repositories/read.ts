import type { DivisionReadStore } from '@/server/application/divisions/repositories/read';
import { prisma } from '@/lib/db';

export const divisionReadStore: DivisionReadStore = {
  async listByTournament(tournamentId) {
    return prisma.division.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    });
  },

  async findById(id) {
    return prisma.division.findUnique({
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
  },
};
