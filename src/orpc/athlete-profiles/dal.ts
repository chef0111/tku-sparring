import type {
  AthleteProfilesDTO,
  CreateAthleteProfileDTO,
  UpdateAthleteProfileDTO,
} from './dto';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { prisma } from '@/lib/db';
import { filterColumns } from '@/lib/data-table/filter-columns';
import {
  getNameSortKey,
  orderFieldForColumnId,
} from '@/lib/sort/name-sort-key';
import { athleteProfileFilterMap } from '@/lib/data-table/mappings/athlete-profiles';
import { getValidFilters } from '@/lib/data-table/utils';

export class AthleteProfileDAL {
  static async findMany(input: AthleteProfilesDTO) {
    const {
      page,
      perPage,
      query,
      athleteCode,
      name,
      gender,
      affiliation,
      beltLevels,
      beltLevelMin,
      beltLevelMax,
      weightMin,
      weightMax,
      sorting,
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
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              {
                athleteCode: { contains: query, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
      ...(athleteCode
        ? {
            athleteCode: {
              contains: athleteCode,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(name
        ? { name: { contains: name, mode: 'insensitive' as const } }
        : {}),
      ...(gender && gender.length > 0 ? { gender: { in: gender } } : {}),
      ...(affiliation
        ? {
            affiliation: {
              contains: affiliation,
              mode: 'insensitive' as const,
            },
          }
        : {}),
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

    const where = advancedTable ? advancedWhere : legacyWhere;

    const orderBy =
      sorting.length > 0
        ? sorting.map((s) => ({
            [orderFieldForColumnId(s.id)]: s.desc
              ? ('desc' as const)
              : ('asc' as const),
          }))
        : [{ createdAt: 'desc' as const }];

    const [rows, total] = await Promise.all([
      prisma.athleteProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.athleteProfile.count({ where }),
    ]);

    const items: Array<AthleteProfileData> = rows.map(
      ({ nameSortKey: _nameSortKey, ...row }) => ({
        ...row,
        athleteCode: row.athleteCode ?? '',
        image: row.image ?? null,
      })
    );

    return { items, total };
  }

  static async findById(id: string) {
    return prisma.athleteProfile.findUnique({ where: { id } });
  }

  static async findByAthleteCodeAndName(
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

  static async findPossibleDuplicates(input: {
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

  static async create(data: Omit<CreateAthleteProfileDTO, 'confirmDuplicate'>) {
    return prisma.athleteProfile.create({
      data: {
        ...data,
        nameSortKey: getNameSortKey(data.name),
      },
    });
  }

  static async update(id: string, data: Omit<UpdateAthleteProfileDTO, 'id'>) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.athleteProfile.update({
        where: { id },
        data: {
          ...data,
          ...(data.name !== undefined
            ? { nameSortKey: getNameSortKey(data.name) }
            : {}),
        },
      });

      if (data.image !== undefined) {
        await tx.tournamentAthlete.updateMany({
          where: { athleteProfileId: id },
          data: { image: data.image },
        });
      }

      return profile;
    });
  }

  static async deleteProfile(id: string) {
    return prisma.athleteProfile.delete({ where: { id } });
  }

  static async deleteProfiles(ids: Array<string>) {
    const result = await prisma.athleteProfile.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }
}
