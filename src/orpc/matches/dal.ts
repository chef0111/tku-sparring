import { coalesceMatchRead, findMatchesByGroupId } from './match-read';
import { prisma } from '@/lib/db';

export class MatchDAL {
  static async findByGroupId(groupId: string) {
    return findMatchesByGroupId(groupId);
  }

  static async findByTournamentId(tournamentId: string) {
    const rows = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    return rows.map((m) => coalesceMatchRead(m));
  }

  static async findById(id: string) {
    const m = await prisma.match.findUnique({ where: { id } });
    if (!m) return null;
    return coalesceMatchRead(m);
  }
}
