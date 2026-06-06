import {
  buildManualRankMap,
  buildMatchNumber,
  formatArenaMatchTitle,
  resolveArenaGroupOrder,
} from './arena-match-label';
import { matchProjectionSelect, toMatchData } from './match-projection';
import { savedArenaGroupIds } from './arena-group-order';
import type { MatchData } from '@/features/dashboard/types';
import { prisma } from '@/lib/db';

export function normalizeMatchLabelKey(label: string): string {
  return label.trim().toLowerCase();
}

export type MatchLabelContext = {
  arenaIndex: number;
  groupIdsOnArena: Array<string>;
  allMatches: Array<MatchData>;
  numbers: Map<string, number | null>;
  assignedBracketTitleKeys: Set<string>;
};

export async function loadMatchLabelContext(input: {
  tournamentId: string;
  groupId: string;
}): Promise<MatchLabelContext> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
    select: {
      arenaGroupOrder: true,
      groups: {
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

  const targetGroup = tournament.groups.find((g) => g.id === input.groupId);
  if (!targetGroup) throw new Error('Group not found on tournament');

  const arenaIndex = targetGroup.arenaIndex;
  const groupsOnArena = tournament.groups.filter(
    (g) => g.arenaIndex === arenaIndex
  );
  const saved = savedArenaGroupIds(tournament.arenaGroupOrder, arenaIndex);
  const groupOrder = resolveArenaGroupOrder(groupsOnArena, saved);
  const groupIdsOnArena = groupsOnArena.map((g) => g.id);

  const allMatchRows = await prisma.match.findMany({
    where: { groupId: { in: groupIdsOnArena } },
    select: matchProjectionSelect,
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });

  const athleteCountRows = await prisma.tournamentAthlete.groupBy({
    by: ['groupId'],
    where: { groupId: { in: groupIdsOnArena } },
    _count: { _all: true },
  });
  const groupAthleteCountById = new Map<string, number>();
  for (const row of athleteCountRows) {
    if (row.groupId != null) {
      groupAthleteCountById.set(row.groupId, row._count._all);
    }
  }

  const meta = groupsOnArena.map((g) => ({
    id: g.id,
    thirdPlaceMatch: g.thirdPlaceMatch,
  }));
  const allMatches = allMatchRows.map(toMatchData);
  const numbers = buildMatchNumber({
    arenaIndex,
    groups: meta,
    matches: allMatches,
    groupOrder,
    groupAthleteCountById,
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
    groupIdsOnArena,
    allMatches,
    numbers,
    assignedBracketTitleKeys,
  };
}
