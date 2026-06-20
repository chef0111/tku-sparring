import type { DeviceLastSelectionStore } from '../repositories/last-selection';
import type { SetLastSelectionCommand } from './commands';
import { BadRequestError, NotFoundError } from '@/server/application/errors';

export async function setLastSelection(
  command: SetLastSelectionCommand,
  store: DeviceLastSelectionStore
) {
  let tournamentId =
    command.tournamentId === undefined ? null : command.tournamentId;
  let divisionId = command.divisionId === undefined ? null : command.divisionId;
  const matchId = command.matchId === undefined ? null : command.matchId;

  if (matchId) {
    const match = await store.findMatchContext(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    if (divisionId && match.divisionId !== divisionId) {
      throw new BadRequestError('Match does not belong to the given division');
    }
    if (tournamentId && match.tournamentId !== tournamentId) {
      throw new BadRequestError(
        'Match does not belong to the given tournament'
      );
    }
    divisionId = match.divisionId;
    tournamentId = match.tournamentId;
  } else if (divisionId) {
    const division = await store.findDivisionContext(divisionId);
    if (!division) {
      throw new NotFoundError('Division not found');
    }
    if (tournamentId && division.tournamentId !== tournamentId) {
      throw new BadRequestError(
        'Division does not belong to the given tournament'
      );
    }
    tournamentId = division.tournamentId;
  } else if (tournamentId) {
    const exists = await store.existsTournament(tournamentId);
    if (!exists) {
      throw new NotFoundError('Tournament not found');
    }
  }

  return store.upsert({
    ...command,
    tournamentId,
    divisionId,
    matchId,
  });
}
