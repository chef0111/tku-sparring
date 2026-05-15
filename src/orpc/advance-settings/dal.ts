import type { MatchData, MatchStatus } from '@/features/dashboard/types';
import type { SelectionCatalogDTO, SelectionMatchesDTO } from './dto';
import { savedArenaGroupIds } from '@/lib/tournament/arena-group-order';
import {
  buildManualRankMapFromMatches,
  buildSharedArenaMatchNumberById,
  formatArenaMatchTitle,
  resolveArenaGroupOrder,
} from '@/lib/tournament/arena-match-label';
import { prisma } from '@/lib/db';
import { ArenaMatchClaimDAL } from '@/orpc/arena-match-claim/dal';

/**
 * Group `status` for Advance Settings (no `Group.status` column in DB).
 * - Tournament `completed` ⇒ every group `completed`.
 * - No matches in group ⇒ `draft`.
 * - Every match `complete` ⇒ `completed`.
 * - Tournament `active` and not all complete ⇒ `active`.
 * - Otherwise `draft`.
 */
export function deriveGroupStatusForSelectionView(
  tournamentStatus: string,
  matchStatuses: Array<string>
): 'draft' | 'active' | 'completed' {
  if (tournamentStatus === 'completed') {
    return 'completed';
  }
  if (matchStatuses.length === 0) {
    return 'draft';
  }
  const allComplete = matchStatuses.every((s) => s === 'complete');
  if (allComplete) {
    return 'completed';
  }
  if (tournamentStatus === 'active') {
    return 'active';
  }
  return 'draft';
}

function prismaMatchToMatchData(m: {
  id: string;
  round: number;
  matchIndex: number;
  status: string;
  bestOf: number;
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
    round: m.round,
    matchIndex: m.matchIndex,
    status: m.status as MatchStatus,
    bestOf: m.bestOf,
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

const tournamentForSelectionSelect = {
  id: true,
  status: true,
  arenaGroupOrder: true,
  groups: {
    select: {
      id: true,
      name: true,
      tournamentId: true,
      arenaIndex: true,
      thirdPlaceMatch: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

async function loadTournamentForSelection(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: tournamentForSelectionSelect,
  });
}

export type SelectionGroupRow = {
  id: string;
  name: string;
  tournamentId: string;
  status: 'draft' | 'active' | 'completed';
  arenaIndex: number;
  arenaLabel: string;
};

export type MatchClaimSelectionStatus = 'none' | 'held_by_me' | 'held_by_other';

export type SelectionMatchRow = {
  id: string;
  label: string;
  groupId: string;
  status: string;
  redAthleteName: string | null;
  blueAthleteName: string | null;
  /** Exclusive lock held by another device. */
  disabled: boolean;
  claimStatus: MatchClaimSelectionStatus;
};

export class AdvanceSettingsDAL {
  static async selectionCatalog(input: SelectionCatalogDTO) {
    const tournaments = await prisma.tournament.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const effectiveTournamentId = input.tournamentId ?? null;
    const groupsOut: Array<SelectionGroupRow> = [];

    if (!effectiveTournamentId) {
      return { tournaments, groups: groupsOut };
    }

    const tournament = await loadTournamentForSelection(effectiveTournamentId);
    if (!tournament || tournament.status !== 'active') {
      return { tournaments, groups: groupsOut };
    }

    const matchStatusRows = await prisma.match.findMany({
      where: { tournamentId: effectiveTournamentId },
      select: { groupId: true, status: true },
    });
    const statusesByGroup = new Map<string, Array<string>>();
    for (const r of matchStatusRows) {
      const arr = statusesByGroup.get(r.groupId) ?? [];
      arr.push(r.status);
      statusesByGroup.set(r.groupId, arr);
    }

    for (const g of tournament.groups) {
      const matchStatuses = statusesByGroup.get(g.id) ?? [];
      const status = deriveGroupStatusForSelectionView(
        tournament.status,
        matchStatuses
      );
      groupsOut.push({
        id: g.id,
        name: g.name,
        tournamentId: g.tournamentId,
        status,
        arenaIndex: g.arenaIndex,
        arenaLabel: `Arena ${g.arenaIndex}`,
      });
    }

    return { tournaments, groups: groupsOut };
  }

  static async selectionMatches(input: SelectionMatchesDTO) {
    const now = new Date();
    await ArenaMatchClaimDAL.cleanupExpired(now);

    const { tournamentId, groupId } = input;

    const groupRow = await prisma.group.findUnique({
      where: { id: groupId },
      select: { tournamentId: true },
    });
    if (!groupRow) {
      throw new Error('Group not found');
    }
    if (groupRow.tournamentId !== tournamentId) {
      throw new Error('Group does not belong to the selected tournament');
    }

    const tournament = await loadTournamentForSelection(tournamentId);
    const matchesOut: Array<SelectionMatchRow> = [];
    if (!tournament || tournament.status !== 'active') {
      return { matches: matchesOut };
    }

    const targetGroup = tournament.groups.find((x) => x.id === groupId);
    if (!targetGroup) {
      throw new Error('Group not found on tournament');
    }

    const arenaIndex = targetGroup.arenaIndex;
    const groupsOnArena = tournament.groups.filter(
      (x) => x.arenaIndex === arenaIndex
    );
    const saved = savedArenaGroupIds(tournament.arenaGroupOrder, arenaIndex);
    const groupOrder = resolveArenaGroupOrder(groupsOnArena, saved);
    const groupIdsOnArena = groupsOnArena.map((x) => x.id);

    const allMatches = await prisma.match.findMany({
      where: { groupId: { in: groupIdsOnArena } },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });

    const meta = groupsOnArena.map((x) => ({
      id: x.id,
      thirdPlaceMatch: x.thirdPlaceMatch,
    }));
    const matchDataList = allMatches.map(prismaMatchToMatchData);
    const numbers = buildSharedArenaMatchNumberById({
      arenaIndex,
      groups: meta,
      matches: matchDataList,
      groupOrder,
      manualRankByMatchId: buildManualRankMapFromMatches(matchDataList),
    });

    const taIds = new Set<string>();
    for (const m of allMatches) {
      if (m.redTournamentAthleteId) {
        taIds.add(m.redTournamentAthleteId);
      }
      if (m.blueTournamentAthleteId) {
        taIds.add(m.blueTournamentAthleteId);
      }
    }
    const names =
      taIds.size > 0
        ? await prisma.tournamentAthlete.findMany({
            where: { id: { in: [...taIds] } },
            select: { id: true, name: true },
          })
        : [];
    const nameById = new Map(names.map((t) => [t.id, t.name]));

    for (const m of allMatches) {
      if (m.groupId !== groupId) {
        continue;
      }
      if (
        (m.status !== 'pending' && m.status !== 'active') ||
        !m.redTournamentAthleteId ||
        !m.blueTournamentAthleteId
      ) {
        continue;
      }
      const n = numbers.get(m.id);
      matchesOut.push({
        id: m.id,
        label: n != null ? formatArenaMatchTitle(n) : `Match ${m.id.slice(-6)}`,
        groupId: m.groupId,
        status: m.status,
        redAthleteName: m.redTournamentAthleteId
          ? (nameById.get(m.redTournamentAthleteId) ?? null)
          : null,
        blueAthleteName: m.blueTournamentAthleteId
          ? (nameById.get(m.blueTournamentAthleteId) ?? null)
          : null,
        disabled: false,
        claimStatus: 'none',
      });
    }

    const claimByMatchId = await ArenaMatchClaimDAL.activeClaimsByMatchId(
      matchesOut.map((x) => x.id),
      now
    );

    for (const row of matchesOut) {
      const claim = claimByMatchId.get(row.id);
      if (!claim) {
        row.claimStatus = 'none';
        row.disabled = false;
        continue;
      }
      if (claim.deviceId === input.deviceId) {
        row.claimStatus = 'held_by_me';
        row.disabled = false;
      } else {
        row.claimStatus = 'held_by_other';
        row.disabled = true;
      }
    }

    return { matches: matchesOut };
  }
}
