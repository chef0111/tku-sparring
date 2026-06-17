import type {
  AssignSlotCommand,
  SetLockCommand,
  SwapSlotsCommand,
} from './round0-slot-commands';
import type { Round0SlotStore } from '../repositories/round0-slot';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function setLock(command: SetLockCommand, store: Round0SlotStore) {
  const match = await store.findMatch(command.matchId);
  if (!match) throw new NotFoundError('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.slot.edit');

  return store.setLock(command);
}

export async function assignSlot(
  command: AssignSlotCommand,
  store: Round0SlotStore
) {
  const match = await store.findMatch(command.matchId);
  if (!match) throw new NotFoundError('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.slot.edit');

  return store.assignSlot(command);
}

export async function swapSlots(
  command: SwapSlotsCommand,
  store: Round0SlotStore
) {
  const match = await store.findMatch(command.matchAId);
  if (!match) throw new NotFoundError('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.slot.edit');

  return store.swapSlots(command);
}
