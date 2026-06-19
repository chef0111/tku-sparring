import type {
  ListTournamentsQuery,
  TournamentsPage,
} from '@/server/application/tournaments/repositories/read';
import type { Prisma } from '@/generated/prisma/client';
import { TournamentStatusSchema } from '@/lib/tournament/tournament-status';
import { countActionableMatchesByTournamentId } from '@/lib/tournament/bracket/bracket-action-queue';
import {
  matchProjectionSelect,
  toMatchData,
} from '@/server/domain/tournament/match/match-projection';
import { prisma } from '@/lib/db';

type SortableField = 'name' | 'status' | 'athletes' | 'createdAt';

const SORTABLE_FIELDS = new Set<SortableField>([
  'name',
  'status',
  'athletes',
  'createdAt',
]);

function toSortField(field?: string): SortableField {
  if (field && SORTABLE_FIELDS.has(field as SortableField))
    return field as SortableField;
  return 'createdAt';
}

function toOrderBy(
  field?: string,
  direction: Prisma.SortOrder = 'desc'
): Prisma.TournamentOrderByWithRelationInput {
  switch (toSortField(field)) {
    case 'athletes':
      return { tournamentAthletes: { _count: direction } };
    case 'name':
      return { nameSortKey: direction };
    case 'status':
      return { status: direction };
    case 'createdAt':
    default:
      return { createdAt: direction };
  }
}

async function attachActionableMatchCounts<
  T extends {
    id: string;
    _count: { groups: number; matches: number; tournamentAthletes: number };
  },
>(items: Array<T>) {
  if (items.length === 0) return items;

  const tournamentIds = items.map((item) => item.id);
  const [groups, matches] = await Promise.all([
    prisma.group.findMany({
      where: { tournamentId: { in: tournamentIds } },
      select: {
        id: true,
        tournamentId: true,
        _count: { select: { tournamentAthletes: true } },
      },
    }),
    prisma.match.findMany({
      where: { tournamentId: { in: tournamentIds } },
      select: matchProjectionSelect,
    }),
  ]);

  const actionableByTournamentId = countActionableMatchesByTournamentId(
    groups,
    matches.map(toMatchData)
  );

  return items.map((item) => ({
    ...item,
    _count: {
      ...item._count,
      actionableMatches: actionableByTournamentId.get(item.id) ?? 0,
    },
  }));
}

export async function listTournaments(
  input: ListTournamentsQuery
): Promise<TournamentsPage> {
  const {
    page = 1,
    perPage = 20,
    query,
    name,
    status,
    sort,
    sortDir = 'desc',
  } = input;

  const filters: Array<Prisma.TournamentWhereInput> = [];

  if (query) {
    filters.push({ name: { contains: query, mode: 'insensitive' } });
  }
  if (name) {
    filters.push({ name: { contains: name, mode: 'insensitive' } });
  }
  if (status && status.length > 0) {
    filters.push({ status: { in: status } });
  }

  const where =
    filters.length > 0
      ? ({ AND: filters } satisfies Prisma.TournamentWhereInput)
      : undefined;

  const [rows, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: toOrderBy(sort, sortDir),
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: {
          select: { groups: true, matches: true, tournamentAthletes: true },
        },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  const enrichedItems = await attachActionableMatchCounts(rows);
  const items = enrichedItems.map((item) => ({
    ...item,
    status: TournamentStatusSchema.parse(item.status),
  }));

  return { items, total } as TournamentsPage;
}
