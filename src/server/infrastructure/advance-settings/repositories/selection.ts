import type { AdvanceSelectionStore } from '@/server/application/advance-settings/repositories/selection';
import type {
  SelectionDivisionRow,
  SelectionMatchRow,
} from '@/contracts/advance/selection';
import type {
  SelectionCatalogQuery,
  SelectionMatchesQuery,
} from '@/server/application/advance-settings/use-cases/selection-commands';
import { deriveGroupStatusForSelectionView } from '@/server/domain/tournament/advance/selection-status';
import { formatArenaMatchTitle } from '@/server/domain/tournament/arena/match-label';
import { loadMatchLabelContext } from '@/server/infrastructure/tournament/match-label-context';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { loadActiveClaimsByMatchId } from '@/server/infrastructure/arena-match-claim/active-claims';
import { prisma } from '@/lib/db';

const tournamentForSelectionSelect = {
  id: true,
  status: true,
  arenaDivisionOrder: true,
  divisions: {
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

export const advanceSelectionStore: AdvanceSelectionStore = {
  async selectionCatalog(input: SelectionCatalogQuery) {
    const tournaments = await prisma.tournament.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const effectiveTournamentId = input.tournamentId ?? null;
    const divisionsOut: Array<SelectionDivisionRow> = [];

    if (!effectiveTournamentId) {
      return { tournaments, divisions: divisionsOut };
    }

    const tournament = await loadTournament(effectiveTournamentId);
    if (!tournament || tournament.status !== 'active') {
      return { tournaments, divisions: divisionsOut };
    }

    const matchStatusRows = await prisma.match.findMany({
      where: { tournamentId: effectiveTournamentId },
      select: { divisionId: true, status: true },
    });
    const statusesByDivision = new Map<string, Array<string>>();
    for (const r of matchStatusRows) {
      const arr = statusesByDivision.get(r.divisionId) ?? [];
      arr.push(r.status);
      statusesByDivision.set(r.divisionId, arr);
    }

    for (const g of tournament.divisions) {
      const matchStatuses = statusesByDivision.get(g.id) ?? [];
      const status = deriveGroupStatusForSelectionView(
        tournament.status,
        matchStatuses
      );
      divisionsOut.push({
        id: g.id,
        name: g.name,
        tournamentId: g.tournamentId,
        status,
        arenaIndex: g.arenaIndex,
        arenaLabel: `Arena ${g.arenaIndex}`,
      });
    }

    return { tournaments, divisions: divisionsOut };
  },

  async selectionMatches(input: SelectionMatchesQuery) {
    const now = new Date();

    const { tournamentId, divisionId } = input;

    const divisionRow = await prisma.division.findUnique({
      where: { id: divisionId },
      select: { tournamentId: true },
    });
    if (!divisionRow) {
      throw new NotFoundError('Division not found');
    }
    if (divisionRow.tournamentId !== tournamentId) {
      throw new BadRequestError(
        'Group does not belong to the selected tournament'
      );
    }

    const tournament = await loadTournament(tournamentId);
    const matchesOut: Array<SelectionMatchRow> = [];
    if (!tournament || tournament.status !== 'active') {
      return { matches: matchesOut };
    }

    const targetDivision = tournament.divisions.find(
      (x) => x.id === divisionId
    );
    if (!targetDivision) {
      throw new NotFoundError('Division not found on tournament');
    }

    const { numbers, allMatches } = await loadMatchLabelContext({
      tournamentId,
      divisionId,
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
      if (m.divisionId !== divisionId) {
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
        divisionId: m.divisionId,
        status: m.status,
        redAthleteName: redTa?.name ?? null,
        blueAthleteName: blueTa?.name ?? null,
        redAthleteImage: redTa?.image ?? null,
        blueAthleteImage: blueTa?.image ?? null,
        disabled: false,
        claimStatus: 'none',
      });
    }

    const claimByMatchId = await loadActiveClaimsByMatchId(
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
  },
};
