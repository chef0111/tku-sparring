import type {
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from './tournament-athletes.dto';
import { prisma } from '@/lib/db';

export async function findByTournamentId(input: ListTournamentAthletesDTO) {
  const {
    tournamentId,
    groupId,
    unassignedOnly,
    status,
    page,
    perPage,
    query,
    gender,
    beltLevels,
    beltLevelMin,
    beltLevelMax,
    weightMin,
    weightMax,
    sorting,
  } = input;

  const where = {
    tournamentId,
    ...(unassignedOnly ? { groupId: null } : groupId ? { groupId } : {}),
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { affiliation: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(gender && gender.length > 0 ? { gender: { in: gender } } : {}),
    ...(beltLevels && beltLevels.length > 0
      ? { beltLevel: { in: beltLevels } }
      : beltLevelMin !== undefined || beltLevelMax !== undefined
        ? {
            beltLevel: {
              ...(beltLevelMin !== undefined ? { gte: beltLevelMin } : {}),
              ...(beltLevelMax !== undefined ? { lte: beltLevelMax } : {}),
            },
          }
        : {}),
    ...(weightMin !== undefined || weightMax !== undefined
      ? {
          weight: {
            ...(weightMin !== undefined ? { gte: weightMin } : {}),
            ...(weightMax !== undefined ? { lte: weightMax } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    sorting.length > 0
      ? sorting.map((s) => ({
          [s.id]: s.desc ? ('desc' as const) : ('asc' as const),
        }))
      : [{ createdAt: 'asc' as const }];

  const [items, total] = await Promise.all([
    prisma.tournamentAthlete.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { athleteProfile: { select: { id: true, athleteCode: true } } },
    }),
    prisma.tournamentAthlete.count({ where }),
  ]);

  return { items, total };
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
