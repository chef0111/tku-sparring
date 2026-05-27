import type { QueryClient } from '@tanstack/react-query';
import { advanceSettingsKeys, matchKeys } from '@/queries/keys';

export function shouldInvalidateAdvanceSelection(
  tournamentId: string,
  queryKey: unknown
): boolean {
  if (!Array.isArray(queryKey) || queryKey[0] !== advanceSettingsKeys.all[0]) {
    return false;
  }

  const scope = queryKey[1];
  if (scope === 'selectionCatalog') {
    return true;
  }

  if (scope === 'selectionMatches') {
    return queryKey[3] === tournamentId;
  }

  return false;
}

export function invalidateAdvanceSettingsQueries(
  queryClient: QueryClient,
  tournamentId: string
) {
  void queryClient.invalidateQueries({
    predicate: (q) =>
      shouldInvalidateAdvanceSelection(tournamentId, q.queryKey),
  });

  void queryClient.invalidateQueries({ queryKey: matchKeys.all });
}

/** @deprecated Use invalidateAdvanceSettingsQueries */
export const invalidateAdvanceSelectionQueries =
  invalidateAdvanceSettingsQueries;
