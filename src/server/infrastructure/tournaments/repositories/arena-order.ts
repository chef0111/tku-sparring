import type { TournamentArenaOrderStore } from '@/server/application/tournaments/repositories/arena-order';
import { findTournamentById } from '@/orpc/tournaments/tournament-lifecycle';
import {
  mergeArenaGroupOrderAfterCrossArenaMove,
  mergeArenaGroupOrderAfterRetireArena,
  patchArenaGroupOrderJson,
} from '@/lib/tournament/arena/arena-group-order';
import { NotFoundError } from '@/server/application/errors';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

async function finishArenaOrderMutation(tournamentId: string) {
  const full = await findTournamentById(tournamentId);
  if (!full) throw new NotFoundError('Tournament not found');
  publishTournamentMutation(tournamentId);
  return full;
}

export const tournamentArenaOrderStore: TournamentArenaOrderStore = {
  async findTournament(tournamentId) {
    return prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        status: true,
        arenaGroupOrder: true,
        groups: { select: { id: true, arenaIndex: true } },
      },
    });
  },

  async setArenaGroupOrder(command, tournament) {
    const nextJson = patchArenaGroupOrderJson(
      tournament.arenaGroupOrder,
      command.arenaIndex,
      command.groupIds
    );

    await prisma.tournament.update({
      where: { id: command.tournamentId },
      data: { arenaGroupOrder: nextJson },
    });

    return finishArenaOrderMutation(command.tournamentId);
  },

  async moveGroupBetweenArenas(command, tournament) {
    const nextJson = mergeArenaGroupOrderAfterCrossArenaMove({
      arenaGroupOrder: tournament.arenaGroupOrder,
      groups: tournament.groups,
      groupId: command.groupId,
      fromArena: command.fromArena,
      toArena: command.toArena,
      insertIndex: command.insertIndex,
    });

    await prisma.$transaction([
      prisma.group.update({
        where: { id: command.groupId },
        data: { arenaIndex: command.toArena },
      }),
      prisma.tournament.update({
        where: { id: command.tournamentId },
        data: { arenaGroupOrder: nextJson },
      }),
    ]);

    return finishArenaOrderMutation(command.tournamentId);
  },

  async ensureArenaSlot(command, tournament) {
    const nextJson = patchArenaGroupOrderJson(
      tournament.arenaGroupOrder,
      command.arenaIndex,
      []
    );

    await prisma.tournament.update({
      where: { id: command.tournamentId },
      data: { arenaGroupOrder: nextJson },
    });

    return finishArenaOrderMutation(command.tournamentId);
  },

  async retireArena(command, tournament) {
    const nextJson = mergeArenaGroupOrderAfterRetireArena({
      arenaGroupOrder: tournament.arenaGroupOrder,
      groups: tournament.groups,
      fromArena: command.fromArena,
      toArena: command.toArena,
    });

    await prisma.$transaction([
      prisma.group.updateMany({
        where: {
          tournamentId: command.tournamentId,
          arenaIndex: command.fromArena,
        },
        data: { arenaIndex: command.toArena },
      }),
      prisma.tournament.update({
        where: { id: command.tournamentId },
        data: { arenaGroupOrder: nextJson },
      }),
    ]);

    return finishArenaOrderMutation(command.tournamentId);
  },
};
