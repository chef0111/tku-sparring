import type { QueryClient } from '@tanstack/react-query';
import {
  activityKeys,
  divisionKeys,
  tournamentAthleteKeys,
  tournamentKeys,
} from '@/queries/keys';

export function invalidateDivisionListQueries(
  queryClient: QueryClient,
  tournamentId?: string
) {
  if (tournamentId) {
    return queryClient.invalidateQueries({
      queryKey: divisionKeys.list(tournamentId),
    });
  }
  return queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
}

export function invalidateAfterDivisionWrite(
  queryClient: QueryClient,
  tournamentId?: string
) {
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
  void invalidateDivisionListQueries(queryClient, tournamentId);
  void queryClient.invalidateQueries({ queryKey: tournamentAthleteKeys.all });
  void queryClient.invalidateQueries({ queryKey: activityKeys.all });
}

/** @deprecated Use invalidateDivisionListQueries */
export function invalidateOrpcDivisionListQueries(queryClient: QueryClient) {
  return invalidateDivisionListQueries(queryClient);
}

/** @deprecated Use invalidateDivisionListQueries with predicate — kept for transition */
export function isOrpcDivisionListQuery(query: {
  queryKey: ReadonlyArray<unknown>;
}): boolean {
  const key = query.queryKey;
  return (
    Array.isArray(key) &&
    key.length >= 3 &&
    key[0] === 'division' &&
    key[1] === 'list'
  );
}
