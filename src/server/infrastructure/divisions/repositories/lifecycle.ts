import type { DivisionLifecycleStore } from '@/server/application/divisions/repositories/lifecycle';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

export const divisionLifecycleStore: DivisionLifecycleStore = {
  async findTournament(tournamentId) {
    return prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true },
    });
  },

  async findDivision(id) {
    const group = await prisma.division.findUnique({
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
      assertTournamentAction(tournament.status, 'division.create');

      return tx.division.create({ data: command });
    });

    publishTournamentMutation(group.tournamentId);
    return group;
  },

  async update(command) {
    const { id, ...data } = command;
    const group = await prisma.$transaction(async (tx) => {
      const existing = await tx.division.findUnique({
        where: { id },
        include: { tournament: { select: { status: true } } },
      });
      if (!existing) throw new NotFoundError('Division not found');
      assertTournamentAction(existing.tournament.status, 'division.update');

      return tx.division.update({ where: { id }, data });
    });

    publishTournamentMutation(group.tournamentId);
    return group;
  },

  async delete(command) {
    const group = await prisma.$transaction(async (tx) => {
      const existing = await tx.division.findUnique({
        where: { id: command.id },
        include: { tournament: { select: { status: true } } },
      });
      if (!existing) throw new NotFoundError('Division not found');
      assertTournamentAction(existing.tournament.status, 'division.delete');

      return tx.division.delete({ where: { id: command.id } });
    });

    publishTournamentMutation(group.tournamentId);
    return group;
  },
};
