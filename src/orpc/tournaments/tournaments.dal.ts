import type {
  CreateTournamentDTO,
  ListTournamentsDTO,
  UpdateTournamentDTO,
} from './tournaments.dto';
import type { Prisma } from '@prisma/client';
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
      return {
        tournamentAthletes: {
          _count: direction,
        },
      };
    case 'name':
      return { name: direction };
    case 'status':
      return { status: direction };
    case 'createdAt':
    default:
      return { createdAt: direction };
  }
}

export async function findMany(input: ListTournamentsDTO) {
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
    filters.push({
      name: { contains: query, mode: 'insensitive' },
    });
  }

  if (name) {
    filters.push({
      name: { contains: name, mode: 'insensitive' },
    });
  }

  if (status && status.length > 0) {
    filters.push({
      status: { in: status },
    });
  }

  const where =
    filters.length > 0
      ? ({ AND: filters } satisfies Prisma.TournamentWhereInput)
      : undefined;

  const [items, total] = await Promise.all([
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

  return { items, total };
}

export async function findById(id: string) {
  return await prisma.tournament.findUnique({
    where: { id },
    include: {
      groups: {
        include: {
          _count: { select: { tournamentAthletes: true, matches: true } },
        },
      },
      _count: {
        select: { groups: true, matches: true, tournamentAthletes: true },
      },
    },
  });
}

export async function create(data: CreateTournamentDTO) {
  return await prisma.tournament.create({ data });
}

export async function update(
  id: string,
  data: Omit<UpdateTournamentDTO, 'id'>
) {
  return await prisma.tournament.update({
    where: { id },
    data,
  });
}

export async function deleteTournament(id: string) {
  return await prisma.tournament.delete({ where: { id } });
}
