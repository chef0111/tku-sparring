import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBuilderManagerQuery } from './use-builder-manager-query';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import { invalidateOrpcGroupListQueries } from '@/queries/groups';
import { useTournamentReadOnly } from '@/hooks/use-tournament-read-only';
import { authClient } from '@/lib/auth-client';

export interface UseTournamentBuilderArgs {
  tournament: TournamentData;
  groups: Array<GroupData>;
  tournamentId: string;
}

export function useTournamentBuilder({
  tournament,
  groups,
  tournamentId,
}: UseTournamentBuilderArgs) {
  void groups;

  const isReadOnly = useTournamentReadOnly(tournamentId);
  const { tab, setTab } = useBuilderManagerQuery();
  const queryClient = useQueryClient();

  const [activityOpen, setActivityOpen] = React.useState(false);
  const [showEditTournament, setShowEditTournament] = React.useState(false);
  const [showDeleteTournament, setShowDeleteTournament] = React.useState(false);
  const [showAutoAssignAll, setShowAutoAssignAll] = React.useState(false);
  const [lifecycleTarget, setLifecycleTarget] = React.useState<
    'active' | 'completed' | null
  >(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!isReadOnly) return;
    setShowEditTournament(false);
    setShowDeleteTournament(false);
    setShowAutoAssignAll(false);
    setLifecycleTarget(null);
  }, [isReadOnly]);

  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user;

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tournament'] }),
        invalidateOrpcGroupListQueries(queryClient),
        queryClient.invalidateQueries({ queryKey: ['match'] }),
        queryClient.invalidateQueries({ queryKey: ['tournamentAthlete'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const handleLifecycle = React.useCallback(() => {
    if (tournament.status === 'draft') {
      setLifecycleTarget('active');
    } else if (tournament.status === 'active') {
      setLifecycleTarget('completed');
    }
  }, [tournament.status]);

  return {
    isReadOnly,
    tab,
    setTab,
    activityOpen,
    setActivityOpen,
    showEditTournament,
    setShowEditTournament,
    showDeleteTournament,
    setShowDeleteTournament,
    showAutoAssignAll,
    setShowAutoAssignAll,
    lifecycleTarget,
    setLifecycleTarget,
    isRefreshing,
    user,
    handleRefresh,
    handleLifecycle,
  };
}
