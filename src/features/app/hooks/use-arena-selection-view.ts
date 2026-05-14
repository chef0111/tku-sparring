import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { client } from '@/orpc/client';

export function arenaSelectionCatalogQueryOptions(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
}) {
  const { deviceId, tournamentId } = args;

  return queryOptions({
    queryKey: [
      'advanceSettings',
      'selectionCatalog',
      deviceId ?? null,
      tournamentId ?? null,
    ] as const,
    queryFn: () =>
      client.advanceSettings.selectionCatalog({
        deviceId: deviceId!,
        tournamentId: tournamentId ?? undefined,
      }),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function arenaSelectionMatchesQueryOptions(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
  groupId: string | null;
}) {
  const { deviceId, tournamentId, groupId } = args;

  return queryOptions({
    queryKey: [
      'advanceSettings',
      'selectionMatches',
      deviceId ?? null,
      tournamentId ?? null,
      groupId ?? null,
    ] as const,
    queryFn: () =>
      client.advanceSettings.selectionMatches({
        deviceId: deviceId!,
        tournamentId: tournamentId!,
        groupId: groupId!,
      }),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useArenaSelectionCatalog(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = args;
  return useQuery({
    ...arenaSelectionCatalogQueryOptions(rest),
    enabled: Boolean(rest.deviceId && enabled),
  });
}

export function useArenaSelectionMatches(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
  groupId: string | null;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = args;
  const hasScope = Boolean(rest.deviceId && rest.tournamentId && rest.groupId);
  return useQuery({
    ...arenaSelectionMatchesQueryOptions(rest),
    enabled: hasScope && enabled,
    placeholderData: keepPreviousData,
  });
}
