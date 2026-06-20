import { findTournamentById } from './read-lifecycle';
import type { TournamentArenaOrderStore } from '@/server/application/tournaments/repositories/arena-order';
import {
  mergeArenaDivisionOrderAfterCrossArenaMove,
  mergeArenaDivisionOrderAfterRetireArena,
  patchArenaDivisionOrderJson,
} from '@/server/domain/tournament/arena/arena-division-order';
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
        arenaDivisionOrder: true,
        divisions: { select: { id: true, arenaIndex: true } },
      },
    });
  },

  async setArenaDivisionOrder(command, tournament) {
    const nextJson = patchArenaDivisionOrderJson(
      tournament.arenaDivisionOrder,
      command.arenaIndex,
      command.divisionIds
    );

    await prisma.tournament.update({
      where: { id: command.tournamentId },
      data: { arenaDivisionOrder: nextJson },
    });

    return finishArenaOrderMutation(command.tournamentId);
  },

  async moveDivisionBetweenArenas(command, tournament) {
    const nextJson = mergeArenaDivisionOrderAfterCrossArenaMove({
      arenaDivisionOrder: tournament.arenaDivisionOrder,
      divisions: tournament.divisions,
      divisionId: command.divisionId,
      fromArena: command.fromArena,
      toArena: command.toArena,
      insertIndex: command.insertIndex,
    });

    await prisma.$transaction([
      prisma.division.update({
        where: { id: command.divisionId },
        data: { arenaIndex: command.toArena },
      }),
      prisma.tournament.update({
        where: { id: command.tournamentId },
        data: { arenaDivisionOrder: nextJson },
      }),
    ]);

    return finishArenaOrderMutation(command.tournamentId);
  },

  async ensureArenaSlot(command, tournament) {
    const nextJson = patchArenaDivisionOrderJson(
      tournament.arenaDivisionOrder,
      command.arenaIndex,
      []
    );

    await prisma.tournament.update({
      where: { id: command.tournamentId },
      data: { arenaDivisionOrder: nextJson },
    });

    return finishArenaOrderMutation(command.tournamentId);
  },

  async retireArena(command, tournament) {
    const nextJson = mergeArenaDivisionOrderAfterRetireArena({
      arenaDivisionOrder: tournament.arenaDivisionOrder,
      divisions: tournament.divisions,
      fromArena: command.fromArena,
      toArena: command.toArena,
    });

    await prisma.$transaction([
      prisma.division.updateMany({
        where: {
          tournamentId: command.tournamentId,
          arenaIndex: command.fromArena,
        },
        data: { arenaIndex: command.toArena },
      }),
      prisma.tournament.update({
        where: { id: command.tournamentId },
        data: { arenaDivisionOrder: nextJson },
      }),
    ]);

    return finishArenaOrderMutation(command.tournamentId);
  },
};
