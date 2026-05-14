import * as React from 'react';
import type { GroupData, MatchData } from '@/features/dashboard/types';
import {
  buildArenaMatchNumberById,
  buildManualRankMapFromMatches,
  buildSharedArenaMatchNumberById,
  resolveArenaGroupOrder,
} from '@/lib/tournament/arena-match-label';
import {
  savedArenaGroupIds,
  shouldShowArenaOrderUi,
} from '@/lib/tournament/arena-group-order';
import { useMatches, useTournamentMatches } from '@/queries/matches';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import { useTournament } from '@/queries/tournaments';

export interface UseBracketsTabQueriesArgs {
  tournamentId: string;
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  tournamentStatus: string;
  readOnly: boolean;
}

export function useBracketsTabQueries({
  tournamentId,
  groups,
  selectedGroupId,
  tournamentStatus,
  readOnly,
}: UseBracketsTabQueriesArgs) {
  const matchesQuery = useMatches(selectedGroupId);
  const tournamentMatchesQuery = useTournamentMatches(tournamentId);
  const tournamentQuery = useTournament(tournamentId);
  const athletesQuery = useTournamentAthletes({
    tournamentId,
    groupId: selectedGroupId ?? undefined,
    unassignedOnly: false,
    page: 1,
    perPage: 200,
    sorting: [],
  });

  const matches = matchesQuery.data ?? [];
  const tournamentMatches = (tournamentMatchesQuery.data ??
    []) as Array<MatchData>;
  const athletes = athletesQuery.data?.items ?? [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const arenaGroupOrder = tournamentQuery.data?.arenaGroupOrder;

  const arenaNumberByMatchId = React.useMemo(() => {
    if (!selectedGroup) return new Map<string, number>();
    const arenaIdx = selectedGroup.arenaIndex;
    const groupsOnArena = groups.filter((g) => g.arenaIndex === arenaIdx);
    const saved = savedArenaGroupIds(arenaGroupOrder, arenaIdx);
    const groupOrder = resolveArenaGroupOrder(groupsOnArena, saved);
    const onArena = new Set(groupsOnArena.map((g) => g.id));
    const arenaMatches = tournamentMatches.filter((m) =>
      onArena.has(m.groupId)
    );
    if (arenaMatches.length === 0) {
      const local = matches as Array<MatchData>;
      if (local.length > 0) {
        return buildArenaMatchNumberById(
          local,
          arenaIdx,
          selectedGroup.thirdPlaceMatch
        );
      }
      return new Map<string, number>();
    }
    const manual = buildManualRankMapFromMatches(arenaMatches);
    return buildSharedArenaMatchNumberById({
      arenaIndex: arenaIdx,
      groups: groupsOnArena.map((g) => ({
        id: g.id,
        thirdPlaceMatch: g.thirdPlaceMatch,
      })),
      matches: arenaMatches,
      groupOrder,
      manualRankByMatchId: manual.size > 0 ? manual : undefined,
    });
  }, [selectedGroup, groups, tournamentMatches, matches, arenaGroupOrder]);

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
  const athleteCount = selectedGroup?._count.tournamentAthletes ?? 0;
  const toolbarDisabled = matches.length === 0;
  const maxBracketRound =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;

  const isDraft = tournamentStatus === 'draft';
  const showArenaOrderEntry = React.useMemo(
    () => shouldShowArenaOrderUi(groups, arenaGroupOrder),
    [groups, arenaGroupOrder]
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
    selectedGroup,
    arenaGroupOrder,
    arenaNumberByMatchId,
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
