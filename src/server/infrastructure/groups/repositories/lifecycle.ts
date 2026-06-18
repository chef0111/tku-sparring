import type { GroupLifecycleStore } from '@/server/application/groups/repositories/lifecycle';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

export const groupLifecycleStore: GroupLifecycleStore = {
  async findTournament(tournamentId) {
    return prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true },
    });
  },

  async findGroup(id) {
    const group = await prisma.group.findUnique({
      where: { id },
      include: { tournament: { select: { status: true } } },
    });
    if (!group) return null;

    return {
      id: group.id,
      tournamentId: group.tournamentId,
      tournamentStatus: group.tournament.status,
    };
  },

  async create(command) {
    const group = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: command.tournamentId },
        select: { status: true },
      });
      if (!tournament) throw new NotFoundError('Tournament not found');
      assertTournamentAction(tournament.status, 'group.create');

      return tx.group.create({ data: command });
    });

    publishTournamentMutation(group.tournamentId);
    return group;
  },

  async update(command) {
    const { id, ...data } = command;
    const group = await prisma.$transaction(async (tx) => {
      const existing = await tx.group.findUnique({
        where: { id },
        include: { tournament: { select: { status: true } } },
      });
      if (!existing) throw new NotFoundError('Group not found');
      assertTournamentAction(existing.tournament.status, 'group.update');

      return tx.group.update({ where: { id }, data });
    });

    publishTournamentMutation(group.tournamentId);
    return group;
  },

  async delete(command) {
    const group = await prisma.$transaction(async (tx) => {
      const existing = await tx.group.findUnique({
        where: { id: command.id },
        include: { tournament: { select: { status: true } } },
      });
      if (!existing) throw new NotFoundError('Group not found');
      assertTournamentAction(existing.tournament.status, 'group.delete');

      return tx.group.delete({ where: { id: command.id } });
    });

    publishTournamentMutation(group.tournamentId);
    return group;
  },
};
