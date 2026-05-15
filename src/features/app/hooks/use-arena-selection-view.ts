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
  const catalogTournamentId =
    tournamentId && tournamentId.length > 0 ? tournamentId : null;

  return queryOptions({
    queryKey: [
      'advanceSettings',
      'selectionCatalog',
      deviceId ?? null,
      catalogTournamentId,
    ] as const,
    queryFn: () =>
      client.advanceSettings.selectionCatalog({
        deviceId: deviceId!,
        tournamentId: catalogTournamentId ?? undefined,
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
  const tid = tournamentId && tournamentId.length > 0 ? tournamentId : null;
  const gid = groupId && groupId.length > 0 ? groupId : null;

  return queryOptions({
    queryKey: [
      'advanceSettings',
      'selectionMatches',
      deviceId ?? null,
      tid,
      gid,
    ] as const,
    queryFn: () =>
      client.advanceSettings.selectionMatches({
        deviceId: deviceId!,
        tournamentId: tid!,
        groupId: gid!,
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
  const hasScope = Boolean(
    rest.deviceId &&
    rest.tournamentId &&
    rest.tournamentId.length > 0 &&
    rest.groupId &&
    rest.groupId.length > 0
  );
  return useQuery({
    ...arenaSelectionMatchesQueryOptions(rest),
    enabled: hasScope && enabled,
    placeholderData: keepPreviousData,
  });
}
