import type { QueryClient } from '@tanstack/react-query';
import { activityKeys } from '@/queries/keys';

export function invalidateActivityQueries(
  queryClient: QueryClient,
  tournamentId?: string
) {
  if (tournamentId) {
    return queryClient.invalidateQueries({
      queryKey: [...activityKeys.lists(), tournamentId],
    });
  }
  return queryClient.invalidateQueries({ queryKey: activityKeys.all });
}
