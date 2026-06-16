import type { CreateGroupDTO, UpdateGroupDTO } from './dto';
import { publishTournamentMutation } from '@/orpc/mutation-effects';
import { notFound } from '@/orpc/errors';
import { prisma } from '@/lib/db';
import { assertTournamentAction } from '@/orpc/policies/tournament-policy';

export async function createGroup(input: CreateGroupDTO) {
  const group = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: input.tournamentId },
      select: { status: true },
    });
    if (!tournament) notFound('Tournament not found');
    assertTournamentAction(tournament.status, 'group.create');

    return tx.group.create({ data: input });
  });

  publishTournamentMutation(group.tournamentId);
  return group;
}

export async function updateGroup(
  id: string,
  data: Omit<UpdateGroupDTO, 'id'>
) {
  const group = await prisma.$transaction(async (tx) => {
    const existing = await tx.group.findUnique({
      where: { id },
      include: { tournament: { select: { status: true } } },
    });
    if (!existing) notFound('Group not found');
    assertTournamentAction(existing.tournament.status, 'group.update');

    return tx.group.update({ where: { id }, data });
  });

  publishTournamentMutation(group.tournamentId);
  return group;
}

export async function deleteGroup(id: string) {
  const group = await prisma.$transaction(async (tx) => {
    const existing = await tx.group.findUnique({
      where: { id },
      include: { tournament: { select: { status: true } } },
    });
    if (!existing) notFound('Group not found');
    assertTournamentAction(existing.tournament.status, 'group.delete');

    return tx.group.delete({ where: { id } });
  });

  publishTournamentMutation(group.tournamentId);
  return group;
}
