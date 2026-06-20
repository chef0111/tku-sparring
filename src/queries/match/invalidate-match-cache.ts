import type { QueryClient } from '@tanstack/react-query';
import {
  activityKeys,
  advanceSettingsKeys,
  divisionKeys,
  matchKeys,
  tournamentKeys,
} from '@/queries/keys';

export function invalidateMatchQueries(
  queryClient: QueryClient,
  scope?: { tournamentId?: string; divisionId?: string }
) {
  if (scope?.divisionId) {
    void queryClient.invalidateQueries({
      queryKey: matchKeys.listByDivision(scope.divisionId),
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
  void queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: activityKeys.all });
  void queryClient.invalidateQueries({ queryKey: advanceSettingsKeys.all });
}
