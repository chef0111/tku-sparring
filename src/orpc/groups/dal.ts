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
}
