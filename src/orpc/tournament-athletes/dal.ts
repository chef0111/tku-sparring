import type { Prisma } from '@prisma/client';
import type {
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from './dto';
import { prisma } from '@/lib/db';
import {
  getNameSortKey,
  orderFieldForColumnId,
} from '@/lib/sort/name-sort-key';

export class TournamentAthleteDAL {
  /** MongoDB: `field: null` does not match documents where the field is omitted. */
  private static readonly UNASSIGNED_GROUP_FILTER = {
    OR: [{ groupId: null }, { groupId: { isSet: false } }],
  } satisfies Prisma.TournamentAthleteWhereInput;

  static async findByTournamentId(input: ListTournamentAthletesDTO) {
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

    const andBranches: Array<Prisma.TournamentAthleteWhereInput> = [];
    if (unassignedOnly) {
      andBranches.push(TournamentAthleteDAL.UNASSIGNED_GROUP_FILTER);
    } else if (groupId) {
      andBranches.push({ groupId });
    }
    if (query) {
      andBranches.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { affiliation: { contains: query, mode: 'insensitive' as const } },
        ],
      });
    }

    const where: Prisma.TournamentAthleteWhereInput = {
      tournamentId,
      ...(andBranches.length > 0 ? { AND: andBranches } : {}),
      ...(status ? { status } : {}),
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
            [orderFieldForColumnId(s.id)]: s.desc
              ? ('desc' as const)
              : ('asc' as const),
          }))
        : [{ createdAt: 'asc' as const }];

    const [items, total] = await Promise.all([
      prisma.tournamentAthlete.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          athleteProfile: { select: { id: true, athleteCode: true } },
        },
      }),
      prisma.tournamentAthlete.count({ where }),
    ]);

    return { items, total };
  }

  static async bulkCreate(
    tournamentId: string,
    profiles: Array<{
      id: string;
      name: string;
      gender: string;
      beltLevel: number;
      weight: number;
      affiliation: string;
      image: string | null;
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
        nameSortKey: getNameSortKey(p.name),
        gender: p.gender,
        beltLevel: p.beltLevel,
        weight: p.weight,
        affiliation: p.affiliation,
        image: p.image ?? null,
        status: 'selected',
      })),
    });

    return toCreate;
  }

  static async updateTournamentAthlete(
    id: string,
    data: Omit<UpdateTournamentAthleteDTO, 'id'>
  ) {
    return prisma.tournamentAthlete.update({ where: { id }, data });
  }

  static async removeTournamentAthlete(id: string) {
    return prisma.tournamentAthlete.delete({ where: { id } });
  }

  static async bulkRemoveTournamentAthletes(ids: Array<string>) {
    const result = await prisma.tournamentAthlete.deleteMany({
      where: { id: { in: ids } },
    });
    return { removed: result.count };
  }
}
