import { skipToken, useQuery } from '@tanstack/react-query';
import {
  arenaSelectionCatalogQueryOptions,
  arenaSelectionMatchesQueryOptions,
} from '@/queries/advance-settings/arena-selection-query-options';

export function useArenaSelectionCatalog(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  const { enabled = true, refetchInterval = false, ...rest } = args;
  return useQuery({
    ...arenaSelectionCatalogQueryOptions(rest),
    enabled: Boolean(rest.deviceId && enabled),
    refetchInterval,
  });
}

export function useArenaSelectionMatches(args: {
  deviceId: string | undefined;
  tournamentId: string | null;
  divisionId: string | null;
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  const { enabled = true, refetchInterval = false, ...rest } = args;
  const hasScope = Boolean(
    rest.deviceId &&
    rest.tournamentId &&
    rest.tournamentId.length > 0 &&
    rest.divisionId &&
    rest.divisionId.length > 0
  );
  const base = arenaSelectionMatchesQueryOptions(rest);
  const canRun = hasScope && enabled;
  return useQuery({
    ...base,
    queryFn: canRun ? base.queryFn : skipToken,
    refetchInterval: canRun ? refetchInterval : false,
  });
}
