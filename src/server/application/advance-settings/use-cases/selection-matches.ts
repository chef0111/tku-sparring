import type { AdvanceSelectionStore } from '../repositories/selection';
import type { SelectionMatchesQuery } from './selection-commands';

export async function selectionMatches(
  query: SelectionMatchesQuery,
  store: AdvanceSelectionStore
) {
  return store.selectionMatches(query);
}
