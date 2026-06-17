import type { GroupReadStore } from '@/server/application/groups/repositories/read';
import { prisma } from '@/lib/db';

export const groupReadStore: GroupReadStore = {
  async listByTournament(tournamentId) {
    return prisma.group.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    });
  },

  async findById(id) {
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
  },
};
