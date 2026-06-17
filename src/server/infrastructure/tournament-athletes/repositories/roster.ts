import type { Prisma } from '@/generated/prisma/client';
import type { TournamentAthleteStore } from '@/server/application/tournament-athletes/repositories/roster';
import type {
  BulkRemoveTournamentAthletesCommand,
  ListTournamentAthletesQuery,
  RemoveTournamentAthleteCommand,
  UpdateTournamentAthleteCommand,
} from '@/server/application/tournament-athletes/use-cases/roster-commands';
import { prisma } from '@/lib/db';
import {
  getNameSortKey,
  orderFieldForColumnId,
} from '@/lib/sort/name-sort-key';
import { NotFoundError } from '@/server/application/errors';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

const UNASSIGNED_GROUP_FILTER = {
  groupId: null,
} satisfies Prisma.TournamentAthleteWhereInput;

function buildListWhere(input: ListTournamentAthletesQuery) {
  const {
    tournamentId,
    groupId,
    unassignedOnly,
    status,
    query,
    gender,
    beltLevels,
    beltLevelMin,
    beltLevelMax,
    weightMin,
    weightMax,
  } = input;

  const andBranches: Array<Prisma.TournamentAthleteWhereInput> = [];
  if (unassignedOnly) {
    andBranches.push(UNASSIGNED_GROUP_FILTER);
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

  return {
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
  } satisfies Prisma.TournamentAthleteWhereInput;
}

export const tournamentAthleteStore: TournamentAthleteStore = {
  async list(input) {
    const { page, perPage, sorting } = input;
    const where = buildListWhere(input);

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
  },

  async findProfilesByIds(ids) {
    return prisma.athleteProfile.findMany({
      where: { id: { in: ids } },
    });
  },

  async bulkCreate(tournamentId, profiles) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true },
    });
    if (!tournament) throw new NotFoundError('Tournament not found');
    assertTournamentAction(tournament.status, 'roster.add');

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

    publishTournamentMutation(tournamentId);
    return toCreate;
  },

  async update(command: UpdateTournamentAthleteCommand) {
    const { id, ...data } = command;
    const existing = await prisma.tournamentAthlete.findUnique({
      where: { id },
      include: { tournament: { select: { status: true } } },
    });
    if (!existing) throw new NotFoundError('Tournament athlete not found');
    assertTournamentAction(existing.tournament.status, 'roster.update');

    const updated = await prisma.tournamentAthlete.update({
      where: { id },
      data,
      include: {
        athleteProfile: { select: { id: true, athleteCode: true } },
      },
    });
    publishTournamentMutation(updated.tournamentId);
    return updated;
  },

  async remove(command: RemoveTournamentAthleteCommand) {
    const existing = await prisma.tournamentAthlete.findUnique({
      where: { id: command.id },
      include: { tournament: { select: { status: true } } },
    });
    if (!existing) throw new NotFoundError('Tournament athlete not found');
    assertTournamentAction(existing.tournament.status, 'roster.delete');

    const deleted = await prisma.tournamentAthlete.delete({
      where: { id: command.id },
      include: {
        athleteProfile: { select: { id: true, athleteCode: true } },
      },
    });
    publishTournamentMutation(deleted.tournamentId);
    return deleted;
  },

  async bulkRemove(command: BulkRemoveTournamentAthletesCommand) {
    const rows = await prisma.tournamentAthlete.findMany({
      where: { id: { in: command.ids } },
      select: {
        tournamentId: true,
        tournament: { select: { status: true } },
      },
    });
    for (const row of rows) {
      assertTournamentAction(row.tournament.status, 'roster.delete');
    }

    const result = await prisma.tournamentAthlete.deleteMany({
      where: { id: { in: command.ids } },
    });
    for (const tournamentId of new Set(rows.map((row) => row.tournamentId))) {
      publishTournamentMutation(tournamentId);
    }
    return { removed: result.count };
  },

  async countAssigned(tournamentId, profileIds) {
    const rows = await prisma.tournamentAthlete.findMany({
      where: {
        tournamentId,
        athleteProfileId: { in: profileIds },
      },
      select: { groupId: true },
    });
    return rows.filter((r) => r.groupId != null).length;
  },
};
