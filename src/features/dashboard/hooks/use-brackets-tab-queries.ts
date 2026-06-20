import * as React from 'react';
import type { DivisionData } from '@/contracts/tournament/division';
import type { MatchData } from '@/contracts/tournament/match';
import {
  buildArenaMatchNumberById,
  buildManualRankMap,
  buildMatchNumber,
  resolveArenaDivisionOrder,
} from '@/lib/tournament/arena/match-label';
import {
  savedArenaDivisionIds,
  shouldShowArenaOrderUi,
} from '@/lib/tournament/arena/arena-division-order';
import { useMatches, useTournamentMatches } from '@/queries/match';
import { useTournamentAthletes } from '@/queries/tournament-athlete';
import { useTournament } from '@/queries/tournament';

export interface UseBracketsTabQueriesArgs {
  tournamentId: string;
  divisions: Array<DivisionData>;
  selectedDivisionId: string | null;
  tournamentStatus: string;
  readOnly: boolean;
}

export function useBracketsTabQueries({
  tournamentId,
  divisions,
  selectedDivisionId,
  tournamentStatus,
  readOnly,
}: UseBracketsTabQueriesArgs) {
  const matchesQuery = useMatches(selectedDivisionId);
  const tournamentMatchesQuery = useTournamentMatches(tournamentId);
  const tournamentQuery = useTournament(tournamentId);
  const athletesQuery = useTournamentAthletes({
    tournamentId,
    divisionId: selectedDivisionId ?? undefined,
    unassignedOnly: false,
    page: 1,
    perPage: 200,
    sorting: [],
  });

  const matches = matchesQuery.data ?? [];
  const tournamentMatches = (tournamentMatchesQuery.data ??
    []) as Array<MatchData>;
  const athletes = athletesQuery.data?.items ?? [];
  const selectedDivision = divisions.find((d) => d.id === selectedDivisionId);

  const arenaDivisionOrder = tournamentQuery.data?.arenaDivisionOrder;

  const matchLabel = React.useMemo(() => {
    if (!selectedDivision) return new Map<string, number | null>();
    const arenaIdx = selectedDivision.arenaIndex;
    const divisionsOnArena = divisions.filter((d) => d.arenaIndex === arenaIdx);
    const saved = savedArenaDivisionIds(arenaDivisionOrder, arenaIdx);
    const divisionOrder = resolveArenaDivisionOrder(divisionsOnArena, saved);
    const onArena = new Set(divisionsOnArena.map((d) => d.id));
    const arenaMatches = tournamentMatches.filter((m) =>
      onArena.has(m.divisionId)
    );
    if (arenaMatches.length === 0) {
      const local = matches as Array<MatchData>;
      if (local.length > 0) {
        return buildArenaMatchNumberById(
          local,
          arenaIdx,
          selectedDivision.thirdPlaceMatch,
          selectedDivision._count.tournamentAthletes
        );
      }
      return new Map<string, number | null>();
    }
    const manual = buildManualRankMap(arenaMatches);
    const divisionAthleteCountById = new Map(
      divisionsOnArena.map(
        (d) => [d.id, d._count.tournamentAthletes] as [string, number]
      )
    );
    return buildMatchNumber({
      arenaIndex: arenaIdx,
      divisions: divisionsOnArena.map((d) => ({
        id: d.id,
        thirdPlaceMatch: d.thirdPlaceMatch,
      })),
      matches: arenaMatches,
      divisionOrder,
      divisionAthleteCountById,
      manualRankByMatchId: manual.size > 0 ? manual : undefined,
    });
  }, [
    selectedDivision,
    divisions,
    tournamentMatches,
    matches,
    arenaDivisionOrder,
  ]);

  const assignedRound0TaIds = React.useMemo(() => {
    const s = new Set<string>();
    for (const m of matches) {
      if (m.round !== 0) continue;
      if (m.redTournamentAthleteId) s.add(m.redTournamentAthleteId);
      if (m.blueTournamentAthleteId) s.add(m.blueTournamentAthleteId);
    }
    return s;
  }, [matches]);

  const panelPoolAthletes = React.useMemo(
    () => athletes.filter((a) => !assignedRound0TaIds.has(a.id)),
    [athletes, assignedRound0TaIds]
  );

  const isPoolLoading = matchesQuery.isPending || athletesQuery.isPending;
  const athleteCount = selectedDivision?._count.tournamentAthletes ?? 0;
  const toolbarDisabled = matches.length === 0;
  const maxBracketRound = React.useMemo(() => {
    const bracketOnly = matches.filter((m) => m.kind !== 'custom');
    return bracketOnly.length > 0
      ? Math.max(...bracketOnly.map((m) => m.round))
      : 0;
  }, [matches]);

  const isDraft = tournamentStatus === 'draft';
  const showArenaOrderEntry = React.useMemo(
    () => shouldShowArenaOrderUi(divisions, arenaDivisionOrder),
    [divisions, arenaDivisionOrder]
  );
  const arenaOrderEditBlocked = readOnly || !isDraft;
  const arenaOrderDisabledTooltip = readOnly
    ? 'Read-only workspace.'
    : !isDraft
      ? 'Switch tournament to draft to edit arena order.'
      : undefined;

  return {
    matchesQuery,
    matches,
    tournamentMatches,
    athletes,
    selectedDivision,
    arenaDivisionOrder,
    matchLabel,
    panelPoolAthletes,
    isPoolLoading,
    athleteCount,
    toolbarDisabled,
    maxBracketRound,
    showArenaOrderEntry,
    arenaOrderEditBlocked,
    arenaOrderDisabledTooltip,
  };
}

export type BracketsTabQueriesSnapshot = ReturnType<
  typeof useBracketsTabQueries
>;
