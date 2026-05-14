import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type {
  AcquireLeaseDTO,
  HeartbeatLeaseDTO,
  ReleaseLeaseDTO,
  RequestTakeoverDTO,
  RespondTakeoverDTO,
} from '@/orpc/lease/dto';
import { client } from '@/orpc/client';

export type LeaseSnapshot = Awaited<
  ReturnType<typeof client.lease.listForTournament>
>;

export function leasesQueryOptions(tournamentId: string, deviceId?: string) {
  return queryOptions({
    queryKey: ['lease', 'list', tournamentId, deviceId ?? null] as const,
    queryFn: () => client.lease.listForTournament({ tournamentId, deviceId }),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useLeases(tournamentId: string, deviceId?: string) {
  return useQuery(leasesQueryOptions(tournamentId, deviceId));
}

export function setLeaseSnapshotInCache(
  queryClient: QueryClient,
  tournamentId: string,
  snapshot: LeaseSnapshot
) {
  queryClient.setQueryData(leasesQueryOptions(tournamentId).queryKey, snapshot);
}

export function invalidateLeaseQueries(
  queryClient: QueryClient,
  tournamentId: string
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['lease', 'list', tournamentId],
    }),
    queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey;
        return (
          Array.isArray(k) &&
          k[0] === 'advanceSettings' &&
          k[1] === 'selectionCatalog' &&
          k[3] === tournamentId
        );
      },
    }),
  ]);
}

function useInvalidateLeases(tournamentId: string) {
  const queryClient = useQueryClient();

  return () => invalidateLeaseQueries(queryClient, tournamentId);
}

export function useAcquireLease(tournamentId: string) {
  const invalidate = useInvalidateLeases(tournamentId);

  return useMutation({
    mutationFn: (input: AcquireLeaseDTO) => client.lease.acquire(input),
    onSuccess: () => invalidate(),
  });
}

export function useHeartbeatLease(tournamentId: string) {
  const invalidate = useInvalidateLeases(tournamentId);

  return useMutation({
    mutationFn: (input: HeartbeatLeaseDTO) => client.lease.heartbeat(input),
    onSuccess: () => invalidate(),
  });
}

export function useReleaseLease(tournamentId: string) {
  const invalidate = useInvalidateLeases(tournamentId);

  return useMutation({
    mutationFn: (input: ReleaseLeaseDTO) => client.lease.release(input),
    onSuccess: () => invalidate(),
  });
}

export function useRequestLeaseTakeover(tournamentId: string) {
  const invalidate = useInvalidateLeases(tournamentId);

  return useMutation({
    mutationFn: (input: RequestTakeoverDTO) =>
      client.lease.requestTakeover(input),
    onSuccess: () => invalidate(),
  });
}

export function useRespondLeaseTakeover(tournamentId: string) {
  const invalidate = useInvalidateLeases(tournamentId);

  return useMutation({
    mutationFn: (input: RespondTakeoverDTO) =>
      client.lease.respondTakeover(input),
    onSuccess: () => invalidate(),
  });
}
