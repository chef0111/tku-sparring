import type { ActivityListStore } from '../repositories/list';
import type { ListActivityQuery } from './list-commands';

export async function listActivity(
  query: ListActivityQuery,
  store: ActivityListStore
) {
  return store.list(query);
}
