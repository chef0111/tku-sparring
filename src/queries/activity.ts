import { useInfiniteQuery } from '@tanstack/react-query';
import type { TournamentActivityEventType } from '@/orpc/activity/event-types';
import { client } from '@/orpc/client';

function activityTypesQueryKeyPart(
  eventTypes: Array<TournamentActivityEventType> | undefined
) {
  if (!eventTypes?.length) {
    return 'all';
  }
  return [...eventTypes].sort().join(',');
}

export function activityListInfiniteQueryOptions(input: {
  tournamentId: string;
  eventTypes?: Array<TournamentActivityEventType>;
  limit?: number;
}) {
  const { tournamentId, eventTypes, limit = 50 } = input;
  return {
    queryKey: [
      'activity',
      'list',
      tournamentId,
      activityTypesQueryKeyPart(eventTypes),
    ] as const,
    queryFn: ({ pageParam }: { pageParam: { id: string } | undefined }) =>
      client.activity.listForTournament({
        tournamentId,
        eventTypes:
          eventTypes && eventTypes.length > 0 ? eventTypes : undefined,
        cursor: pageParam,
        limit,
      }),
    initialPageParam: undefined as { id: string } | undefined,
    getNextPageParam: (lastPage: { nextCursor: { id: string } | null }) =>
      lastPage.nextCursor ?? undefined,
  };
}

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
