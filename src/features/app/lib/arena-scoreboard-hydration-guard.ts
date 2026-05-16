/**
 * Ensures match.get payload cannot hydrate a different bout than Advance Settings.
 * (TanStack Query already keys by id; this guards cache/coordination edge cases.)
 */
export function isServerMatchRowForSelectedBout(
  selectedMatchId: string,
  row: { id: string } | null | undefined
): row is { id: string } {
  return row != null && row.id === selectedMatchId;
}
