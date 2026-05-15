import type { QueryClient } from '@tanstack/react-query';

export function shouldInvalidateAdvanceSelection(
  tournamentId: string,
  queryKey: unknown
): boolean {
  if (!Array.isArray(queryKey) || queryKey[0] !== 'advanceSettings') {
    return false;
  }

  const scope = queryKey[1];
  if (scope === 'selectionCatalog') {
    return queryKey[3] === tournamentId;
  }

  if (scope === 'selectionMatches') {
    return queryKey[3] === tournamentId;
  }

  return false;
}

export function invalidateAdvanceSelectionQueries(
  queryClient: QueryClient,
  tournamentId: string
) {
  void queryClient.invalidateQueries({
    predicate: (q) =>
      shouldInvalidateAdvanceSelection(tournamentId, q.queryKey),
  });

  void queryClient.invalidateQueries({ queryKey: ['match'] });
}
