import type {
  CreateAthleteProfileDTO,
  ListAthleteProfilesDTO,
  UpdateAthleteProfileDTO,
} from './athlete-profiles.dto';
import { prisma } from '@/lib/db';

type SortableField =
  | 'name'
  | 'beltLevel'
  | 'weight'
  | 'affiliation'
  | 'createdAt';

const SORTABLE_FIELDS = new Set<SortableField>([
  'name',
  'beltLevel',
  'weight',
  'affiliation',
  'createdAt',
]);

function toSortField(field?: string): SortableField {
  if (field && SORTABLE_FIELDS.has(field as SortableField))
    return field as SortableField;
  return 'createdAt';
}

export async function findMany(input: ListAthleteProfilesDTO) {
  const {
    page,
    perPage,
    name,
    gender,
    affiliation,
    beltLevelMin,
    beltLevelMax,
    weightMin,
    weightMax,
    sort,
    sortDir,
  } = input;

  const where = {
    ...(name ? { name: { contains: name, mode: 'insensitive' as const } } : {}),
    ...(gender ? { gender } : {}),
    ...(affiliation
      ? {
          affiliation: {
            contains: affiliation,
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(beltLevelMin !== undefined || beltLevelMax !== undefined
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

  const orderBy = { [toSortField(sort)]: sortDir ?? 'desc' };

  const [items, total] = await Promise.all([
    prisma.athleteProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.athleteProfile.count({ where }),
  ]);

  return { items, total };
}

export async function findById(id: string) {
  return prisma.athleteProfile.findUnique({ where: { id } });
}

export async function findByAthleteCodeAndName(
  athleteCode: string,
  name: string,
  excludeId?: string
) {
  return prisma.athleteProfile.findFirst({
    where: {
      athleteCode,
      name,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function findPossibleDuplicates(input: {
  name: string;
  affiliation: string;
  weight: number;
  beltLevel: number;
  excludeId?: string;
}) {
  return prisma.athleteProfile.findMany({
    where: {
      name: input.name,
      affiliation: input.affiliation,
      weight: input.weight,
      beltLevel: input.beltLevel,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
  });
}

export async function create(
  data: Omit<CreateAthleteProfileDTO, 'confirmDuplicate'>
) {
  return prisma.athleteProfile.create({ data });
}

export async function update(
  id: string,
  data: Omit<UpdateAthleteProfileDTO, 'id'>
) {
  return prisma.athleteProfile.update({ where: { id }, data });
}

export async function deleteProfile(id: string) {
  return prisma.athleteProfile.delete({ where: { id } });
}

export async function deleteProfiles(ids: Array<string>) {
  const result = await prisma.athleteProfile.deleteMany({
    where: { id: { in: ids } },
  });
  return result.count;
}
