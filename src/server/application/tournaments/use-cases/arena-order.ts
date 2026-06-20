import type {
  EnsureArenaSlotCommand,
  MoveDivisionArenaCommand,
  RetireArenaCommand,
  SetArenaDivisionOrderCommand,
} from './arena-order-commands';
import type {
  ArenaOrderTournament,
  TournamentArenaOrderStore,
} from '../repositories/arena-order';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

async function loadTournament(
  tournamentId: string,
  store: TournamentArenaOrderStore
): Promise<ArenaOrderTournament> {
  const tournament = await store.findTournament(tournamentId);
  if (!tournament) throw new NotFoundError('Tournament not found');
  assertTournamentAction(tournament.status, 'arenaOrder.update');
  return tournament;
}

function assertSameArenaDivisionList(
  tournament: ArenaOrderTournament,
  arenaIndex: number,
  divisionIds: Array<string>
) {
  const onArena = tournament.divisions.filter(
    (g) => g.arenaIndex === arenaIndex
  );
  const expected = new Set(onArena.map((g) => g.id));

  if (divisionIds.length !== expected.size) {
    throw new BadRequestError(
      'Division list must include every division on this arena exactly once'
    );
  }

  for (const gid of divisionIds) {
    if (!expected.has(gid)) {
      throw new BadRequestError(
        'Division list must include every division on this arena exactly once'
      );
    }
  }
}

export async function setArenaDivisionOrder(
  command: SetArenaDivisionOrderCommand,
  store: TournamentArenaOrderStore
) {
  const tournament = await loadTournament(command.tournamentId, store);
  assertSameArenaDivisionList(
    tournament,
    command.arenaIndex,
    command.divisionIds
  );
  return store.setArenaDivisionOrder(command, tournament);
}

export async function moveDivisionBetweenArenas(
  command: MoveDivisionArenaCommand,
  store: TournamentArenaOrderStore
) {
  if (command.fromArena === command.toArena) {
    throw new BadRequestError('Same-arena reorder uses setArenaDivisionOrder');
  }

  const tournament = await loadTournament(command.tournamentId, store);

  const group = tournament.divisions.find((g) => g.id === command.divisionId);
  if (!group) throw new NotFoundError('Division not found on this tournament');
  if (group.arenaIndex !== command.fromArena) {
    throw new BadRequestError('Division is not on the source arena');
  }

  const onToAll = tournament.divisions.filter(
    (g) => g.arenaIndex === command.toArena
  );
  const maxInsert = onToAll.length;
  if (command.insertIndex < 0 || command.insertIndex > maxInsert) {
    throw new BadRequestError('Invalid insert index');
  }

  return store.moveDivisionBetweenArenas(command, tournament);
}

export async function ensureArenaSlot(
  command: EnsureArenaSlotCommand,
  store: TournamentArenaOrderStore
) {
  if (command.arenaIndex < 1 || command.arenaIndex > 3) {
    throw new BadRequestError('Arena index must be between 1 and 3');
  }

  const tournament = await loadTournament(command.tournamentId, store);

  const onArena = tournament.divisions.filter(
    (g) => g.arenaIndex === command.arenaIndex
  );
  if (onArena.length > 0) {
    throw new BadRequestError('That arena already has divisions');
  }

  return store.ensureArenaSlot(command, tournament);
}

export async function retireArena(
  command: RetireArenaCommand,
  store: TournamentArenaOrderStore
) {
  if (command.fromArena === command.toArena) {
    throw new BadRequestError(
      'Target arena must differ from the arena being removed'
    );
  }
  if (command.fromArena < 1 || command.fromArena > 3) {
    throw new BadRequestError('Invalid source arena');
  }
  if (command.toArena < 1 || command.toArena > 3) {
    throw new BadRequestError('Invalid target arena');
  }

  const tournament = await loadTournament(command.tournamentId, store);
  return store.retireArena(command, tournament);
}
