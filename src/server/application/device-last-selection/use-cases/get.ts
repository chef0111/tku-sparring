import type { DeviceLastSelectionStore } from '../repositories/last-selection';
import type { GetLastSelectionQuery } from './commands';

export async function getLastSelection(
  query: GetLastSelectionQuery,
  store: DeviceLastSelectionStore
) {
  return store.find(query);
}
