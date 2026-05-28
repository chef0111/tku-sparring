import type { QueryClient } from '@tanstack/react-query';
import { invalidateAthleteProfileQueries } from '@/queries/athlete-profile/invalidate-athlete-profile-cache';
import { invalidateGroupListQueries } from '@/queries/group/invalidate-group-cache';
import { tournamentAthleteKeys, tournamentKeys } from '@/queries/keys';

export function invalidateTournamentAthleteQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: tournamentAthleteKeys.all });
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
}

export function invalidateOnBulkAdd(
  queryClient: QueryClient,
  input: { tournamentId: string; autoAssign?: boolean }
) {
  invalidateTournamentAthleteQueries(queryClient);
  invalidateAthleteProfileQueries(queryClient);
  if (input.autoAssign) {
    void invalidateGroupListQueries(queryClient, input.tournamentId);
  }
}

/** After remove / bulkRemove — refresh roster lists and library exclude state. */
export function invalidateOnRemove(queryClient: QueryClient) {
  invalidateTournamentAthleteQueries(queryClient);
  invalidateAthleteProfileQueries(queryClient);
}
