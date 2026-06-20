import type { MatchLabelContext } from '@/server/domain/tournament/arena/match-label-key';
import {
  buildManualRankMap,
  buildMatchNumber,
  formatArenaMatchTitle,
  resolveArenaDivisionOrder,
} from '@/server/domain/tournament/arena/match-label';
import { normalizeMatchLabelKey } from '@/server/domain/tournament/arena/match-label-key';
import { savedArenaDivisionIds } from '@/server/domain/tournament/arena/arena-division-order';
import {
  matchProjectionSelect,
  toMatchData,
} from '@/server/domain/tournament/match/match-projection';
import { prisma } from '@/lib/db';

export type { MatchLabelContext };

export async function loadMatchLabelContext(input: {
  tournamentId: string;
  divisionId: string;
}): Promise<MatchLabelContext> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
    select: {
      arenaDivisionOrder: true,
      divisions: {
        select: {
          id: true,
          arenaIndex: true,
          thirdPlaceMatch: true,
        },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  });
  if (!tournament) throw new Error('Tournament not found');

  const targetDivision = tournament.divisions.find(
    (g) => g.id === input.divisionId
  );
  if (!targetDivision) throw new Error('Division not found on tournament');

  const arenaIndex = targetDivision.arenaIndex;
  const divisionsOnArena = tournament.divisions.filter(
    (g) => g.arenaIndex === arenaIndex
  );
  const saved = savedArenaDivisionIds(
    tournament.arenaDivisionOrder,
    arenaIndex
  );
  const divisionOrder = resolveArenaDivisionOrder(divisionsOnArena, saved);
  const divisionIdsOnArena = divisionsOnArena.map((g) => g.id);

  const allMatchRows = await prisma.match.findMany({
    where: { divisionId: { in: divisionIdsOnArena } },
    select: matchProjectionSelect,
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });

  const athleteCountRows = await prisma.tournamentAthlete.groupBy({
    by: ['divisionId'],
    where: { divisionId: { in: divisionIdsOnArena } },
    _count: { _all: true },
  });
  const divisionAthleteCountById = new Map<string, number>();
  for (const row of athleteCountRows) {
    if (row.divisionId != null) {
      divisionAthleteCountById.set(row.divisionId, row._count._all);
    }
  }

  const meta = divisionsOnArena.map((g) => ({
    id: g.id,
    thirdPlaceMatch: g.thirdPlaceMatch,
  }));
  const allMatches = allMatchRows.map(toMatchData);
  const numbers = buildMatchNumber({
    arenaIndex,
    divisions: meta,
    matches: allMatches,
    divisionOrder,
    divisionAthleteCountById,
    manualRankByMatchId: buildManualRankMap(allMatches),
  });

  const assignedBracketTitleKeys = new Set<string>();
  for (const m of allMatchRows) {
    if (m.kind === 'custom') continue;
    const n = numbers.get(m.id);
    if (n != null) {
      assignedBracketTitleKeys.add(
        normalizeMatchLabelKey(formatArenaMatchTitle(n))
      );
    }
  }

  return {
    arenaIndex,
    divisionIdsOnArena,
    allMatches,
    numbers,
    assignedBracketTitleKeys,
  };
}
