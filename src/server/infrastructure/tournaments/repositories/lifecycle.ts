import type { TournamentLifecycleStore } from '@/server/application/tournaments/repositories/lifecycle';
import { findTournamentWithLifecycle } from '@/orpc/tournaments/tournament-lifecycle';
import { getNameSortKey } from '@/lib/sort/name-sort-key';
import { NotFoundError } from '@/server/application/errors';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

export const tournamentLifecycleStore: TournamentLifecycleStore = {
  async findWithLifecycle(id) {
    const tournament = await findTournamentWithLifecycle(id);
    if (!tournament) return null;

    return {
      id: tournament.id,
      status: tournament.status,
      lifecycle: tournament.lifecycle,
    };
  },

  async findStatus(id) {
    return prisma.tournament.findUnique({
      where: { id },
      select: { status: true },
    });
  },

  async create(command) {
    return prisma.tournament.create({
      data: {
        name: command.name,
        nameSortKey: getNameSortKey(command.name),
      },
    });
  },

  async update(command) {
    return prisma.tournament.update({
      where: { id: command.id },
      data: {
        name: command.name,
        nameSortKey: getNameSortKey(command.name),
      },
    });
  },

  async applyStatus(input) {
    const updated = await prisma.$transaction(async (tx) => {
      const tournament = await findTournamentWithLifecycle(input.id, tx);
      if (!tournament) throw new NotFoundError('Tournament not found');

      const updatedRow = await tx.tournament.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await recordMutationActivity(
        {
          tournamentId: input.id,
          adminId: input.adminId,
          eventType: 'tournament.status_change',
          entityType: 'tournament',
          entityId: input.id,
          payload: {
            fromStatus: input.fromStatus,
            toStatus: input.status,
            ...(input.force ? { forced: true } : {}),
          },
        },
        tx
      );

      return updatedRow;
    });

    publishTournamentMutation(input.id);
    return updated;
  },

  async delete(command) {
    const deleted = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: command.id },
        select: { id: true, status: true },
      });
      if (!tournament) throw new NotFoundError('Tournament not found');

      await recordMutationActivity(
        {
          tournamentId: command.id,
          adminId: command.adminId,
          eventType: 'tournament.delete',
          entityType: 'tournament',
          entityId: command.id,
          payload: {},
        },
        tx
      );

      return tx.tournament.delete({ where: { id: command.id } });
    });

    publishTournamentMutation(command.id);
    return deleted;
  },
};
