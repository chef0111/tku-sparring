import type { QueryClient } from '@tanstack/react-query';
import {
  activityKeys,
  advanceSettingsKeys,
  groupKeys,
  matchKeys,
  tournamentKeys,
} from '@/queries/keys';

export function invalidateMatchQueries(
  queryClient: QueryClient,
  scope?: { tournamentId?: string; groupId?: string }
) {
  if (scope?.groupId) {
    void queryClient.invalidateQueries({
      queryKey: matchKeys.listByGroup(scope.groupId),
    });
  } else if (scope?.tournamentId) {
    void queryClient.invalidateQueries({
      queryKey: matchKeys.listByTournament(scope.tournamentId),
    });
  } else {
    void queryClient.invalidateQueries({ queryKey: matchKeys.all });
  }
}

export function invalidateAfterMatchWrite(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: matchKeys.all });
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
  void queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: activityKeys.all });
  void queryClient.invalidateQueries({ queryKey: advanceSettingsKeys.all });
}
