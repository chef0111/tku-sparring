import type {
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from './tournament-athletes.dto';
import { prisma } from '@/lib/db';

export async function findByTournamentId(input: ListTournamentAthletesDTO) {
  return prisma.tournamentAthlete.findMany({
    where: {
      tournamentId: input.tournamentId,
      ...(input.groupId !== undefined ? { groupId: input.groupId } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      athleteProfile: {
        select: { id: true, athleteCode: true },
      },
    },
  });
}

export async function bulkCreate(
  tournamentId: string,
  profiles: Array<{
    id: string;
    name: string;
    gender: string;
    beltLevel: number;
    weight: number;
    affiliation: string;
  }>
) {
  const existing = await prisma.tournamentAthlete.findMany({
    where: {
      tournamentId,
      athleteProfileId: { in: profiles.map((p) => p.id) },
    },
    select: { athleteProfileId: true },
  });

  const existingIds = new Set(existing.map((e) => e.athleteProfileId));
  const toCreate = profiles.filter((p) => !existingIds.has(p.id));

  if (toCreate.length === 0) return [];

  await prisma.tournamentAthlete.createMany({
    data: toCreate.map((p) => ({
      tournamentId,
      athleteProfileId: p.id,
      name: p.name,
      gender: p.gender,
      beltLevel: p.beltLevel,
      weight: p.weight,
      affiliation: p.affiliation,
      status: 'selected',
    })),
  });

  return toCreate;
}

export async function updateTournamentAthlete(
  id: string,
  data: Omit<UpdateTournamentAthleteDTO, 'id'>
) {
  return prisma.tournamentAthlete.update({ where: { id }, data });
}

export async function removeTournamentAthlete(id: string) {
  return prisma.tournamentAthlete.delete({ where: { id } });
}

export async function bulkRemoveTournamentAthletes(ids: Array<string>) {
  const result = await prisma.tournamentAthlete.deleteMany({
    where: { id: { in: ids } },
  });
  return { removed: result.count };
}
