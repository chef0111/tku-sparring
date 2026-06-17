import type {
  EnsureArenaSlotCommand,
  MoveGroupArenaCommand,
  RetireArenaCommand,
  SetArenaGroupOrderCommand,
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

function assertSameArenaGroupList(
  tournament: ArenaOrderTournament,
  arenaIndex: number,
  groupIds: Array<string>
) {
  const onArena = tournament.groups.filter((g) => g.arenaIndex === arenaIndex);
  const expected = new Set(onArena.map((g) => g.id));

  if (groupIds.length !== expected.size) {
    throw new BadRequestError(
      'Group list must include every group on this arena exactly once'
    );
  }

  for (const gid of groupIds) {
    if (!expected.has(gid)) {
      throw new BadRequestError(
        'Group list must include every group on this arena exactly once'
      );
    }
  }
}

export async function setArenaGroupOrder(
  command: SetArenaGroupOrderCommand,
  store: TournamentArenaOrderStore
) {
  const tournament = await loadTournament(command.tournamentId, store);
  assertSameArenaGroupList(tournament, command.arenaIndex, command.groupIds);
  return store.setArenaGroupOrder(command, tournament);
}

export async function moveGroupBetweenArenas(
  command: MoveGroupArenaCommand,
  store: TournamentArenaOrderStore
) {
  if (command.fromArena === command.toArena) {
    throw new BadRequestError('Same-arena reorder uses setArenaGroupOrder');
  }

  const tournament = await loadTournament(command.tournamentId, store);

  const group = tournament.groups.find((g) => g.id === command.groupId);
  if (!group) throw new NotFoundError('Group not found on this tournament');
  if (group.arenaIndex !== command.fromArena) {
    throw new BadRequestError('Group is not on the source arena');
  }

  const onToAll = tournament.groups.filter(
    (g) => g.arenaIndex === command.toArena
  );
  const maxInsert = onToAll.length;
  if (command.insertIndex < 0 || command.insertIndex > maxInsert) {
    throw new BadRequestError('Invalid insert index');
  }

  return store.moveGroupBetweenArenas(command, tournament);
}

export async function ensureArenaSlot(
  command: EnsureArenaSlotCommand,
  store: TournamentArenaOrderStore
) {
  if (command.arenaIndex < 1 || command.arenaIndex > 3) {
    throw new BadRequestError('Arena index must be between 1 and 3');
  }

  const tournament = await loadTournament(command.tournamentId, store);

  const onArena = tournament.groups.filter(
    (g) => g.arenaIndex === command.arenaIndex
  );
  if (onArena.length > 0) {
    throw new BadRequestError('That arena already has groups');
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
