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
  divisionId: string | null;
}) {
  const { deviceId, tournamentId, divisionId } = args;
  const tid = tournamentId && tournamentId.length > 0 ? tournamentId : null;
  const did = divisionId && divisionId.length > 0 ? divisionId : null;

  return queryOptions({
    queryKey: advanceSettingsKeys.selectionMatches(deviceId ?? null, tid, did),
    queryFn: () =>
      selectionMatches({
        deviceId: deviceId!,
        tournamentId: tid!,
        divisionId: did!,
      }),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
