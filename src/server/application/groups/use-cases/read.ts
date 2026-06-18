import type { GroupReadStore } from '../repositories/read';
import { NotFoundError } from '@/server/application/errors';

export async function listGroupsByTournament(
  tournamentId: string,
  store: GroupReadStore
) {
  return store.listByTournament(tournamentId);
}

export async function getGroup(id: string, store: GroupReadStore) {
  const group = await store.findById(id);
  if (!group) {
    throw new NotFoundError('Group not found');
  }
  return group;
}
