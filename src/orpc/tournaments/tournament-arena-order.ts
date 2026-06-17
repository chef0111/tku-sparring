import { findTournamentById } from './tournament-lifecycle';
import type {
  EnsureArenaSlotDTO,
  MoveGroupArenaDTO,
  RetireArenaDTO,
  SetArenaGroupOrderDTO,
} from './dto';
import {
  mergeArenaGroupOrderAfterCrossArenaMove,
  mergeArenaGroupOrderAfterRetireArena,
  patchArenaGroupOrderJson,
} from '@/lib/tournament/arena-group-order';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-realtime-broadcast';
import { prisma } from '@/lib/db';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

async function loadTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      status: true,
      arenaGroupOrder: true,
      groups: { select: { id: true, arenaIndex: true } },
    },
  });
  if (!tournament) throw new Error('Tournament not found');
  assertTournamentAction(tournament.status, 'arenaOrder.update');
  return tournament;
}

async function finishArenaOrderMutation(tournamentId: string) {
  const full = await findTournamentById(tournamentId);
  if (!full) throw new Error('Tournament not found');
  publishSelectionInvalidate(tournamentId);
  return full;
}

export async function setArenaGroupOrder(input: SetArenaGroupOrderDTO) {
  const tournament = await loadTournament(input.tournamentId);

  const onArena = tournament.groups.filter(
    (g) => g.arenaIndex === input.arenaIndex
  );

  const expected = new Set(onArena.map((g) => g.id));
  if (input.groupIds.length !== expected.size) {
    throw new Error(
      'Group list must include every group on this arena exactly once'
    );
  }

  for (const gid of input.groupIds) {
    if (!expected.has(gid)) {
      throw new Error(
        'Group list must include every group on this arena exactly once'
      );
    }
  }

  const nextJson = patchArenaGroupOrderJson(
    tournament.arenaGroupOrder,
    input.arenaIndex,
    input.groupIds
  );

  await prisma.tournament.update({
    where: { id: input.tournamentId },
    data: { arenaGroupOrder: nextJson },
  });

  return finishArenaOrderMutation(input.tournamentId);
}

export async function moveGroupBetweenArenas(input: MoveGroupArenaDTO) {
  if (input.fromArena === input.toArena)
    throw new Error('Same-arena reorder uses setArenaGroupOrder');

  const tournament = await loadTournament(input.tournamentId);

  const group = tournament.groups.find((g) => g.id === input.groupId);
  if (!group) throw new Error('Group not found on this tournament');
  if (group.arenaIndex !== input.fromArena)
    throw new Error('Group is not on the source arena');

  const onToAll = tournament.groups.filter(
    (g) => g.arenaIndex === input.toArena
  );
  const maxInsert = onToAll.length;
  if (input.insertIndex < 0 || input.insertIndex > maxInsert)
    throw new Error('Invalid insert index');

  const nextJson = mergeArenaGroupOrderAfterCrossArenaMove({
    arenaGroupOrder: tournament.arenaGroupOrder,
    groups: tournament.groups,
    groupId: input.groupId,
    fromArena: input.fromArena,
    toArena: input.toArena,
    insertIndex: input.insertIndex,
  });

  await prisma.$transaction([
    prisma.group.update({
      where: { id: input.groupId },
      data: { arenaIndex: input.toArena },
    }),
    prisma.tournament.update({
      where: { id: input.tournamentId },
      data: { arenaGroupOrder: nextJson },
    }),
  ]);

  return finishArenaOrderMutation(input.tournamentId);
}

export async function ensureArenaSlot(input: EnsureArenaSlotDTO) {
  const tournament = await loadTournament(input.tournamentId);

  if (input.arenaIndex < 1 || input.arenaIndex > 3)
    throw new Error('Arena index must be between 1 and 3');

  const onArena = tournament.groups.filter(
    (g) => g.arenaIndex === input.arenaIndex
  );
  if (onArena.length > 0) throw new Error('That arena already has groups');

  const nextJson = patchArenaGroupOrderJson(
    tournament.arenaGroupOrder,
    input.arenaIndex,
    []
  );
  await prisma.tournament.update({
    where: { id: input.tournamentId },
    data: { arenaGroupOrder: nextJson },
  });

  return finishArenaOrderMutation(input.tournamentId);
}

export async function retireArena(input: RetireArenaDTO) {
  if (input.fromArena === input.toArena) {
    throw new Error('Target arena must differ from the arena being removed');
  }
  if (input.fromArena < 1 || input.fromArena > 3) {
    throw new Error('Invalid source arena');
  }
  if (input.toArena < 1 || input.toArena > 3) {
    throw new Error('Invalid target arena');
  }

  const tournament = await loadTournament(input.tournamentId);

  const nextJson = mergeArenaGroupOrderAfterRetireArena({
    arenaGroupOrder: tournament.arenaGroupOrder,
    groups: tournament.groups,
    fromArena: input.fromArena,
    toArena: input.toArena,
  });

  await prisma.$transaction([
    prisma.group.updateMany({
      where: {
        tournamentId: input.tournamentId,
        arenaIndex: input.fromArena,
      },
      data: { arenaIndex: input.toArena },
    }),
    prisma.tournament.update({
      where: { id: input.tournamentId },
      data: { arenaGroupOrder: nextJson },
    }),
  ]);

  return finishArenaOrderMutation(input.tournamentId);
}
