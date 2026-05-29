import { throwMatchBadRequest } from './match-domain-error';
import {
  buildManualRankMapFromMatches,
  buildMatchNumber,
  formatArenaMatchTitle,
  resolveArenaGroupOrder,
} from '@/lib/tournament/arena-match-label';
import {
  matchProjectionSelect,
  toMatchData,
} from '@/lib/tournament/match-projection';
import { prisma } from '@/lib/db';
import { savedArenaGroupIds } from '@/lib/tournament/arena-group-order';

export function normalizeMatchLabelKey(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Ensures `displayLabel` does not collide with another custom label (tournament-wide)
 * or an arena-assigned `Match {n}` title for this group's arena (cross-group on same arena).
 */
export async function assertLabelAvailable(input: {
  tournamentId: string;
  groupId: string;
  displayLabel: string;
  excludeMatchId?: string;
}): Promise<void> {
  const trimmed = input.displayLabel.trim();
  if (!trimmed) {
    throwMatchBadRequest('Match label is required');
  }
  const key = normalizeMatchLabelKey(trimmed);

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
  if (!tournament) throwMatchBadRequest('Tournament not found');

  const targetGroup = tournament.groups.find((g) => g.id === input.groupId);
  if (!targetGroup) throwMatchBadRequest('Group not found on tournament');

  const arenaIndex = targetGroup.arenaIndex;
  const groupsOnArena = tournament.groups.filter(
    (g) => g.arenaIndex === arenaIndex
  );
  const saved = savedArenaGroupIds(tournament.arenaGroupOrder, arenaIndex);
  const groupOrder = resolveArenaGroupOrder(groupsOnArena, saved);
  const groupIdsOnArena = groupsOnArena.map((g) => g.id);

  const customs = await prisma.match.findMany({
    where: {
      tournamentId: input.tournamentId,
      kind: 'custom',
      NOT: input.excludeMatchId ? { id: input.excludeMatchId } : undefined,
    },
    select: { id: true, displayLabel: true },
  });
  for (const c of customs) {
    const d = c.displayLabel?.trim();
    if (d && normalizeMatchLabelKey(d) === key) {
      throwMatchBadRequest(
        'That label is already used by another custom match'
      );
    }
  }

  const allMatches = await prisma.match.findMany({
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
  const matchDataList = allMatches.map(toMatchData);
  const numbers = buildMatchNumber({
    arenaIndex,
    groups: meta,
    matches: matchDataList,
    groupOrder,
    groupAthleteCountById,
    manualRankByMatchId: buildManualRankMapFromMatches(matchDataList),
  });

  const assignedTitles = new Set<string>();
  for (const m of allMatches) {
    if (m.kind === 'custom') continue;
    const n = numbers.get(m.id);
    if (n != null) {
      assignedTitles.add(normalizeMatchLabelKey(formatArenaMatchTitle(n)));
    }
  }

  if (assignedTitles.has(key)) {
    throwMatchBadRequest('That label matches an existing arena match number');
  }

  const matchKey = /^match\s+(.+)$/i.exec(trimmed);
  if (matchKey) {
    const tail = matchKey[1]!.trim().toLowerCase();
    for (const m of allMatches) {
      if (m.kind === 'custom') continue;
      const suffix = m.id.slice(-6).toLowerCase();
      if (tail === suffix) {
        throwMatchBadRequest(
          'That label collides with an auto-generated match label'
        );
      }
    }
  }
}
