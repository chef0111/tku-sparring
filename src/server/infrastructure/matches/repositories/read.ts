import type { MatchReadStore } from '@/server/application/matches/repositories/read';
import { coalesceMatchRead } from '@/server/domain/tournament/match/match-read';
import { prisma } from '@/lib/db';

export const matchReadStore: MatchReadStore = {
  async findByDivisionId(divisionId) {
    const rows = await prisma.match.findMany({
      where: { divisionId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    return rows.map((m) => coalesceMatchRead(m));
  },

  async findByTournamentId(tournamentId) {
    const rows = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    return rows.map((m) => coalesceMatchRead(m));
  },

  async findById(id) {
    const m = await prisma.match.findUnique({ where: { id } });
    if (!m) return null;
    return coalesceMatchRead(m);
  },
};

export { coalesceMatchRead };
