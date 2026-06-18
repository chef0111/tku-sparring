import type {
  CreateCustomMatchCommand,
  DeleteCustomMatchCommand,
} from './custom-commands';
import type { CustomMatchStore } from '../repositories/custom';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function createCustomMatch(
  command: CreateCustomMatchCommand,
  store: CustomMatchStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'match.custom.create');

  return store.create({
    command,
    group,
    activity: {
      eventType: 'match.create_custom',
      payload: {
        groupId: command.groupId,
        displayLabel: command.displayLabel.trim(),
      },
    },
  });
}

export async function deleteCustomMatch(
  command: DeleteCustomMatchCommand,
  store: CustomMatchStore
) {
  const match = await store.findForDelete(command.matchId);
  if (!match) throw new NotFoundError('Match not found');
  if (match.kind !== 'custom') {
    throw new BadRequestError('Only custom matches can be deleted');
  }
  assertTournamentAction(match.tournamentStatus, 'match.custom.delete');

  return store.delete({
    matchId: command.matchId,
    adminId: command.adminId,
    activity: {
      eventType: 'match.delete_custom',
      payload: {
        groupId: match.groupId,
        displayLabel: match.displayLabel,
      },
    },
  });
}
