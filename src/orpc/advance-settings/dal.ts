import type { MatchData, MatchStatus } from '@/features/dashboard/types';
import type { SelectionViewDTO } from './dto';
import { savedArenaGroupIds } from '@/lib/tournament/arena-group-order';
import {
  buildManualRankMapFromMatches,
  buildSharedArenaMatchNumberById,
  formatArenaMatchTitle,
  resolveArenaGroupOrder,
} from '@/lib/tournament/arena-match-label';
import { prisma } from '@/lib/db';
import { LeaseDAL } from '@/orpc/lease/dal';
import { resolveGroupLeaseStatus } from '@/orpc/lease/lease-status';

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
  arenaSequenceRank: number | null;
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
    arenaSequenceRank: m.arenaSequenceRank,
  };
}

export class AdvanceSettingsDAL {
  static async selectionView(input: SelectionViewDTO) {
    await LeaseDAL.prepareLeaseReadSnapshot();

    const tournaments = await prisma.tournament.findMany({
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let effectiveTournamentId = input.tournamentId;
    const effectiveGroupId = input.groupId;

    if (effectiveGroupId) {
      const g = await prisma.group.findUnique({
        where: { id: effectiveGroupId },
        select: { tournamentId: true },
      });
      if (!g) {
        throw new Error('Group not found');
      }
      if (effectiveTournamentId && effectiveTournamentId !== g.tournamentId) {
        throw new Error('Group does not belong to the selected tournament');
      }
      effectiveTournamentId = g.tournamentId;
    }

    const groupsOut: Array<{
      id: string;
      name: string;
      tournamentId: string;
      status: 'draft' | 'active' | 'completed';
      leaseStatus: ReturnType<typeof resolveGroupLeaseStatus>;
      arenaIndex: number;
      arenaLabel: string;
    }> = [];

    const matchesOut: Array<{
      id: string;
      label: string;
      groupId: string;
      status: string;
      redAthleteName: string | null;
      blueAthleteName: string | null;
    }> = [];

    if (!effectiveTournamentId) {
      return { tournaments, groups: groupsOut, matches: matchesOut };
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: effectiveTournamentId },
      select: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const leases = await prisma.groupControlLease.findMany({
      where: { tournamentId: effectiveTournamentId },
      include: {
        takeoverRequests: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    const leaseByGroupId = new Map(leases.map((l) => [l.groupId, l]));

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
      const leaseRow = leaseByGroupId.get(g.id) ?? null;
      const leaseStatus = resolveGroupLeaseStatus(
        input.deviceId,
        leaseRow
          ? {
              deviceId: leaseRow.deviceId,
              takeoverRequests: leaseRow.takeoverRequests.map((r) => ({
                requesterDeviceId: r.requesterDeviceId,
              })),
            }
          : null
      );
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
        leaseStatus,
        arenaIndex: g.arenaIndex,
        arenaLabel: `Arena ${g.arenaIndex}`,
      });
    }

    if (effectiveGroupId) {
      const targetGroup = tournament.groups.find(
        (x) => x.id === effectiveGroupId
      );
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
        if (m.groupId !== effectiveGroupId) {
          continue;
        }
        const n = numbers.get(m.id);
        matchesOut.push({
          id: m.id,
          label:
            n != null ? formatArenaMatchTitle(n) : `Match ${m.id.slice(-6)}`,
          groupId: m.groupId,
          status: m.status,
          redAthleteName: m.redTournamentAthleteId
            ? (nameById.get(m.redTournamentAthleteId) ?? null)
            : null,
          blueAthleteName: m.blueTournamentAthleteId
            ? (nameById.get(m.blueTournamentAthleteId) ?? null)
            : null,
        });
      }
    }

    return { tournaments, groups: groupsOut, matches: matchesOut };
  }
}
