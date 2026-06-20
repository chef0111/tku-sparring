import type {
  CreateDivisionCommand,
  DeleteDivisionCommand,
  UpdateDivisionCommand,
} from './lifecycle-commands';
import type { DivisionLifecycleStore } from '../repositories/lifecycle';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function createDivision(
  command: CreateDivisionCommand,
  store: DivisionLifecycleStore
) {
  const tournament = await store.findTournament(command.tournamentId);
  if (!tournament) throw new NotFoundError('Tournament not found');
  assertTournamentAction(tournament.status, 'division.create');
  return store.create(command);
}

export async function updateDivision(
  command: UpdateDivisionCommand,
  store: DivisionLifecycleStore
) {
  const group = await store.findDivision(command.id);
  if (!group) throw new NotFoundError('Division not found');
  assertTournamentAction(group.tournamentStatus, 'division.update');
  return store.update(command);
}

export async function deleteDivision(
  command: DeleteDivisionCommand,
  store: DivisionLifecycleStore
) {
  const group = await store.findDivision(command.id);
  if (!group) throw new NotFoundError('Division not found');
  assertTournamentAction(group.tournamentStatus, 'division.delete');
  return store.delete(command);
}
