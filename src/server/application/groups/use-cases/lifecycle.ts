import type {
  CreateGroupCommand,
  DeleteGroupCommand,
  UpdateGroupCommand,
} from './lifecycle-commands';
import type { GroupLifecycleStore } from '../repositories/lifecycle';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function createGroup(
  command: CreateGroupCommand,
  store: GroupLifecycleStore
) {
  const tournament = await store.findTournament(command.tournamentId);
  if (!tournament) throw new NotFoundError('Tournament not found');
  assertTournamentAction(tournament.status, 'group.create');
  return store.create(command);
}

export async function updateGroup(
  command: UpdateGroupCommand,
  store: GroupLifecycleStore
) {
  const group = await store.findGroup(command.id);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'group.update');
  return store.update(command);
}

export async function deleteGroup(
  command: DeleteGroupCommand,
  store: GroupLifecycleStore
) {
  const group = await store.findGroup(command.id);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'group.delete');
  return store.delete(command);
}
