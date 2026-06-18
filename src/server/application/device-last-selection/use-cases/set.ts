import type { DeviceLastSelectionStore } from '../repositories/last-selection';
import type { SetLastSelectionCommand } from './commands';
import { BadRequestError, NotFoundError } from '@/server/application/errors';

export async function setLastSelection(
  command: SetLastSelectionCommand,
  store: DeviceLastSelectionStore
) {
  let tournamentId =
    command.tournamentId === undefined ? null : command.tournamentId;
  let groupId = command.groupId === undefined ? null : command.groupId;
  const matchId = command.matchId === undefined ? null : command.matchId;

  if (matchId) {
    const match = await store.findMatchContext(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    if (groupId && match.groupId !== groupId) {
      throw new BadRequestError('Match does not belong to the given group');
    }
    if (tournamentId && match.tournamentId !== tournamentId) {
      throw new BadRequestError(
        'Match does not belong to the given tournament'
      );
    }
    groupId = match.groupId;
    tournamentId = match.tournamentId;
  } else if (groupId) {
    const group = await store.findGroupContext(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }
    if (tournamentId && group.tournamentId !== tournamentId) {
      throw new BadRequestError(
        'Group does not belong to the given tournament'
      );
    }
    tournamentId = group.tournamentId;
  } else if (tournamentId) {
    const exists = await store.existsTournament(tournamentId);
    if (!exists) {
      throw new NotFoundError('Tournament not found');
    }
  }

  return store.upsert({
    ...command,
    tournamentId,
    groupId,
    matchId,
  });
}
