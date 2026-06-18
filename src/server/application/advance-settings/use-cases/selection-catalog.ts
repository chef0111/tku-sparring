import type { AdvanceSelectionStore } from '../repositories/selection';
import type { SelectionCatalogQuery } from './selection-commands';

export async function selectionCatalog(
  query: SelectionCatalogQuery,
  store: AdvanceSelectionStore
) {
  return store.selectionCatalog(query);
}
