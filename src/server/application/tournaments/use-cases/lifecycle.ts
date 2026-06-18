import type { TournamentStatusValue } from '@/lib/tournament/tournament-status';
import type {
  CreateTournamentCommand,
  DeleteTournamentCommand,
  SetTournamentStatusCommand,
  UpdateTournamentCommand,
} from './lifecycle-commands';
import type { TournamentLifecycleStore } from '../repositories/lifecycle';
import { TournamentStatusSchema } from '@/lib/tournament/tournament-status';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import {
  assertCanForceTournamentStatus,
  assertTournamentAction,
} from '@/server/application/policies/tournament-policy';

const NEXT_TOURNAMENT_STATUS: Record<
  TournamentStatusValue,
  TournamentStatusValue | null
> = {
  draft: 'active',
  active: 'completed',
  completed: null,
};

function assertNextStatus(
  currentStatus: TournamentStatusValue,
  nextStatus: TournamentStatusValue
) {
  const expectedNextStatus = NEXT_TOURNAMENT_STATUS[currentStatus];

  if (expectedNextStatus !== nextStatus) {
    throw new BadRequestError(
      'Tournament status must advance one step at a time'
    );
  }
}

export async function createTournament(
  command: CreateTournamentCommand,
  store: TournamentLifecycleStore
) {
  return store.create(command);
}

export async function updateTournament(
  command: UpdateTournamentCommand,
  store: TournamentLifecycleStore
) {
  const existing = await store.findStatus(command.id);
  if (!existing) throw new NotFoundError('Tournament not found');
  assertTournamentAction(existing.status, 'tournament.update');
  return store.update(command);
}

export async function setTournamentStatus(
  command: SetTournamentStatusCommand,
  store: TournamentLifecycleStore
) {
  const tournament = await store.findWithLifecycle(command.id);
  if (!tournament) throw new NotFoundError('Tournament not found');

  const currentStatus = TournamentStatusSchema.parse(tournament.status);
  const force = Boolean(command.force);

  if (force) {
    assertCanForceTournamentStatus(currentStatus);
  } else {
    assertTournamentAction(currentStatus, 'tournament.update');
    assertNextStatus(currentStatus, command.status);

    if (command.status === 'completed' && !tournament.lifecycle.canComplete) {
      throw new BadRequestError(
        'Tournament cannot be completed until every group has winner results'
      );
    }
  }

  return store.applyStatus({ ...command, fromStatus: currentStatus });
}

export async function deleteTournament(
  command: DeleteTournamentCommand,
  store: TournamentLifecycleStore
) {
  const existing = await store.findStatus(command.id);
  if (!existing) throw new NotFoundError('Tournament not found');
  assertTournamentAction(existing.status, 'tournament.delete');
  return store.delete(command);
}
