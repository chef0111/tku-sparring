import type { SelectionCatalogDTO, SelectionMatchesDTO } from './dto';
import { formatArenaMatchTitle } from '@/lib/tournament/arena/arena-match-label';
import { loadMatchLabelContext } from '@/lib/tournament/arena/match-label-context';
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

async function loadTournament(tournamentId: string) {
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

export type MatchClaimStatus = 'none' | 'held_by_me' | 'held_by_other';

export type SelectionMatchRow = {
  id: string;
  label: string;
  groupId: string;
  status: string;
  redAthleteName: string | null;
  blueAthleteName: string | null;
  redAthleteImage: string | null;
  blueAthleteImage: string | null;
  /** Exclusive lock held by another device. */
  disabled: boolean;
  claimStatus: MatchClaimStatus;
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

    const tournament = await loadTournament(effectiveTournamentId);
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
    // Intentionally no cleanup here: this is a read path. Expired rows are ignored
    // via `expiresAt > now` in activeClaimsByMatchId; claim() runs cleanupExpired.

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

    const tournament = await loadTournament(tournamentId);
    const matchesOut: Array<SelectionMatchRow> = [];
    if (!tournament || tournament.status !== 'active') {
      return { matches: matchesOut };
    }

    const targetGroup = tournament.groups.find((x) => x.id === groupId);
    if (!targetGroup) {
      throw new Error('Group not found on tournament');
    }

    const { numbers, allMatches } = await loadMatchLabelContext({
      tournamentId,
      groupId,
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
    const tournamentAthletes =
      taIds.size > 0
        ? await prisma.tournamentAthlete.findMany({
            where: { id: { in: [...taIds] } },
            select: { id: true, name: true, image: true },
          })
        : [];
    const athleteByTaId = new Map(
      tournamentAthletes.map((t) => [
        t.id,
        { name: t.name, image: t.image?.trim() || null },
      ])
    );

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
      const redTa = m.redTournamentAthleteId
        ? athleteByTaId.get(m.redTournamentAthleteId)
        : undefined;
      const blueTa = m.blueTournamentAthleteId
        ? athleteByTaId.get(m.blueTournamentAthleteId)
        : undefined;
      const customLabel = m.displayLabel?.trim();
      const label =
        m.kind === 'custom' && customLabel
          ? customLabel
          : n != null
            ? formatArenaMatchTitle(n)
            : `Match ${m.id.slice(-6)}`;
      matchesOut.push({
        id: m.id,
        label,
        groupId: m.groupId,
        status: m.status,
        redAthleteName: redTa?.name ?? null,
        blueAthleteName: blueTa?.name ?? null,
        redAthleteImage: redTa?.image ?? null,
        blueAthleteImage: blueTa?.image ?? null,
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
