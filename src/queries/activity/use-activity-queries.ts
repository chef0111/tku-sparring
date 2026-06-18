import { useInfiniteQuery } from '@tanstack/react-query';
import type { TournamentActivityEventType } from '@/contracts/activity/event-types';
import { activityListInfiniteQueryOptions } from '@/queries/activity/activity-list-query-options';

export function useTournamentActivityInfinite(input: {
  tournamentId: string;
  eventTypes?: Array<TournamentActivityEventType>;
  enabled?: boolean;
}) {
  return useInfiniteQuery({
    ...activityListInfiniteQueryOptions(input),
    enabled: input.enabled ?? true,
  });
}
