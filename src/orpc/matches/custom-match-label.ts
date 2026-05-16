import type { MatchData } from '@/features/dashboard/types';
import {
  buildManualRankMapFromMatches,
  buildMatchNumber,
  formatArenaMatchTitle,
  resolveArenaGroupOrder,
} from '@/lib/tournament/arena-match-label';
import { prisma } from '@/lib/db';
import { savedArenaGroupIds } from '@/lib/tournament/arena-group-order';

function prismaRowToMatchData(m: {
  id: string;
  kind: string;
  displayLabel: string | null;
  round: number;
  matchIndex: number;
  status: string;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redWins: number;
  blueWins: number;
  winnerId: string | null;
  winnerTournamentAthleteId: string | null;
  redLocked: boolean;
  blueLocked: boolean;
  groupId: string;
  tournamentId: string;
  arenaSequenceRank?: number | null;
}): MatchData {
  return {
    id: m.id,
    kind: m.kind === 'custom' ? 'custom' : 'bracket',
    displayLabel: m.displayLabel ?? null,
    round: m.round,
    matchIndex: m.matchIndex,
    status: m.status as MatchData['status'],
    redAthleteId: m.redAthleteId,
    blueAthleteId: m.blueAthleteId,
    redTournamentAthleteId: m.redTournamentAthleteId,
    blueTournamentAthleteId: m.blueTournamentAthleteId,
    redWins: m.redWins,
    blueWins: m.blueWins,
    winnerId: m.winnerId,
    winnerTournamentAthleteId: m.winnerTournamentAthleteId,
    redLocked: m.redLocked,
    blueLocked: m.blueLocked,
    groupId: m.groupId,
    tournamentId: m.tournamentId,
    arenaSequenceRank: m.arenaSequenceRank ?? null,
  };
}

export function normalizeMatchLabelKey(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Ensures `displayLabel` does not collide with another custom label (tournament-wide)
 * or an arena-assigned `Match {n}` title for this group's arena (cross-group on same arena).
 */
export async function assertCustomMatchDisplayLabelAvailable(input: {
  tournamentId: string;
  groupId: string;
  displayLabel: string;
  excludeMatchId?: string;
}): Promise<void> {
  const trimmed = input.displayLabel.trim();
  if (!trimmed) {
    throw new Error('Match label is required');
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
      throw new Error('That label is already used by another custom match');
    }
  }

  const allMatches = await prisma.match.findMany({
    where: { groupId: { in: groupIdsOnArena } },
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
  const matchDataList = allMatches.map(prismaRowToMatchData);
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
    throw new Error('That label matches an existing arena match number');
  }

  const matchKey = /^match\s+(.+)$/i.exec(trimmed);
  if (matchKey) {
    const tail = matchKey[1]!.trim().toLowerCase();
    for (const m of allMatches) {
      if (m.kind === 'custom') continue;
      const suffix = m.id.slice(-6).toLowerCase();
      if (tail === suffix) {
        throw new Error(
          'That label collides with an auto-generated match label'
        );
      }
    }
  }
}
