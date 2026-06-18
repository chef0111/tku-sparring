import type { AthleteProfileStore } from '@/server/application/athlete-profiles/repositories/profile';
import type {
  BulkRemoveProfilesCommand,
  CreateProfileData,
  ListAthleteProfilesQuery,
  UpdateProfileData,
} from '@/server/application/athlete-profiles/use-cases/profile-commands';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { prisma } from '@/lib/db';
import { filterColumns } from '@/lib/data-table/filter-columns';
import {
  getNameSortKey,
  orderFieldForColumnId,
} from '@/lib/sort/name-sort-key';
import { athleteProfileFilterMap } from '@/lib/data-table/mappings/athlete-profiles';
import { getValidFilters } from '@/lib/data-table/utils';

export const athleteProfileStore: AthleteProfileStore = {
  async list(input: ListAthleteProfilesQuery) {
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
      excludeTournamentId,
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

    const tournamentExclusion = excludeTournamentId
      ? {
          NOT: {
            tournamentAthletes: {
              some: { tournamentId: excludeTournamentId },
            },
          },
        }
      : null;

    const baseWhere = advancedTable ? advancedWhere : legacyWhere;
    const where = tournamentExclusion
      ? { AND: [baseWhere, tournamentExclusion] }
      : baseWhere;

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
  },

  findById(id) {
    return prisma.athleteProfile.findUnique({ where: { id } });
  },

  findByAthleteCodeAndName(athleteCode, name, excludeId) {
    return prisma.athleteProfile.findFirst({
      where: {
        athleteCode,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true, affiliation: true },
    });
  },

  findPossibleDuplicates(input) {
    return prisma.athleteProfile.findMany({
      where: {
        name: input.name,
        affiliation: input.affiliation,
        weight: input.weight,
        beltLevel: input.beltLevel,
        ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      },
      select: { id: true, name: true, affiliation: true },
    });
  },

  create(data: CreateProfileData) {
    return prisma.athleteProfile.create({
      data: {
        ...data,
        nameSortKey: getNameSortKey(data.name),
      },
    });
  },

  async update(id: string, data: UpdateProfileData) {
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
  },

  remove(id) {
    return prisma.athleteProfile.delete({ where: { id } });
  },

  async bulkRemove(command: BulkRemoveProfilesCommand) {
    const result = await prisma.athleteProfile.deleteMany({
      where: { id: { in: command.ids } },
    });
    return result.count;
  },
};
