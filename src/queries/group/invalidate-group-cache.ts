import type { QueryClient } from '@tanstack/react-query';
import {
  activityKeys,
  groupKeys,
  tournamentAthleteKeys,
  tournamentKeys,
} from '@/queries/keys';

export function invalidateGroupListQueries(
  queryClient: QueryClient,
  tournamentId?: string
) {
  if (tournamentId) {
    return queryClient.invalidateQueries({
      queryKey: groupKeys.list(tournamentId),
    });
  }
  return queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
}

export function invalidateAfterGroupWrite(
  queryClient: QueryClient,
  tournamentId?: string
) {
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
  void invalidateGroupListQueries(queryClient, tournamentId);
  void queryClient.invalidateQueries({ queryKey: tournamentAthleteKeys.all });
  void queryClient.invalidateQueries({ queryKey: activityKeys.all });
}

/** @deprecated Use invalidateGroupListQueries */
export function invalidateOrpcGroupListQueries(queryClient: QueryClient) {
  return invalidateGroupListQueries(queryClient);
}

/** @deprecated Use invalidateGroupListQueries with predicate — kept for transition */
export function isOrpcGroupListQuery(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key.length >= 3 &&
    key[0] === 'group' &&
    key[1] === 'list'
  );
}
