import type {
  AthleteProfilesDTO,
  CreateAthleteProfileDTO,
  UpdateAthleteProfileDTO,
} from './athlete-profiles.dto';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { prisma } from '@/lib/db';
import { filterColumns } from '@/lib/data-table/filter-columns';
import { athleteProfileFilterMap } from '@/lib/data-table/mappings/athlete-profiles';
import { getValidFilters } from '@/lib/data-table/utils';

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

export async function findMany(input: AthleteProfilesDTO) {
  const {
    page,
    perPage,
    athleteCode,
    name,
    gender,
    affiliation,
    beltLevelMin,
    beltLevelMax,
    weightMin,
    weightMax,
    sort,
    sortDir,
    filterFlag,
    filters,
    joinOperator,
  } = input;

  const advancedTable =
    filterFlag === 'advancedFilters' || filterFlag === 'commandFilters';

  const advancedWhere = filterColumns({
    filters: getValidFilters(filters ?? []),
    joinOperator: joinOperator ?? 'and',
    fields: athleteProfileFilterMap,
  });

  const legacyWhere = {
    ...(athleteCode
      ? { athleteCode: { contains: athleteCode, mode: 'insensitive' as const } }
      : {}),
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

  const where = advancedTable ? advancedWhere : legacyWhere;

  const orderBy = { [toSortField(sort)]: sortDir ?? 'desc' };

  const [rows, total] = await Promise.all([
    prisma.athleteProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.athleteProfile.count({ where }),
  ]);

  const items: Array<AthleteProfileData> = rows.map((row) => ({
    ...row,
    athleteCode: row.athleteCode ?? '',
  }));

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
