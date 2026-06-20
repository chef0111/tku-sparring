import type { DivisionReadStore } from '../repositories/read';
import { NotFoundError } from '@/server/application/errors';

export async function listDivisionsByTournament(
  tournamentId: string,
  store: DivisionReadStore
) {
  return store.listByTournament(tournamentId);
}

export async function getDivision(id: string, store: DivisionReadStore) {
  const group = await store.findById(id);
  if (!group) {
    throw new NotFoundError('Division not found');
  }
  return group;
}
