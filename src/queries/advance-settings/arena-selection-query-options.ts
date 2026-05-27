import { queryOptions } from '@tanstack/react-query';
import { advanceSettingsKeys } from '@/queries/keys';
import {
  selectionCatalog,
  selectionMatches,
} from '@/queries/api/advance-settings-api';

export function arenaSelectionCatalogQueryOptions(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
}) {
  const { deviceId, tournamentId } = args;
  const catalogTournamentId =
    tournamentId && tournamentId.length > 0 ? tournamentId : null;

  return queryOptions({
    queryKey: advanceSettingsKeys.selectionCatalog(
      deviceId ?? null,
      catalogTournamentId
    ),
    queryFn: () =>
      selectionCatalog({
        deviceId: deviceId!,
        tournamentId: catalogTournamentId ?? undefined,
      }),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
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
    queryKey: advanceSettingsKeys.selectionMatches(deviceId ?? null, tid, gid),
    queryFn: () =>
      selectionMatches({
        deviceId: deviceId!,
        tournamentId: tid!,
        groupId: gid!,
      }),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
