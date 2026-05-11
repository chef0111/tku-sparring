import { recordTournamentActivity } from '../activity/tournament-activity.dal';
import type {
  CreateTournamentDTO,
  ListTournamentsDTO,
  SetTournamentStatusDTO,
  TournamentStatusDTO,
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

type TournamentLookupDatabase = Pick<typeof prisma, 'match' | 'tournament'>;
type TournamentStatusDatabase = Pick<
  typeof prisma,
  '$transaction' | 'match' | 'tournament' | 'tournamentActivity'
>;

type TournamentWithCounts = NonNullable<
  Awaited<ReturnType<typeof prisma.tournament.findUnique>>
>;

const NEXT_TOURNAMENT_STATUS: Record<
  TournamentStatusDTO,
  TournamentStatusDTO | null
> = {
  draft: 'active',
  active: 'completed',
  completed: null,
};

async function buildTournamentLifecycle(
  tournament: TournamentWithCounts,
  db: TournamentLookupDatabase
) {
  const hasGroups = tournament.groups.length > 0;
  const hasMatches = tournament._count.matches > 0;
  const everyGroupHasMatches =
    hasGroups && tournament.groups.every((group) => group._count.matches > 0);

  if (!hasGroups || !hasMatches || !everyGroupHasMatches) {
    return {
      canComplete: false,
    };
  }

  const resolvedMatchCount = await db.match.count({
    where: {
      tournamentId: tournament.id,
      winnerId: { not: null },
    },
  });

  return {
    canComplete: resolvedMatchCount === tournament._count.matches,
  };
}

async function findTournamentWithLifecycle(
  id: string,
  db: TournamentLookupDatabase = prisma
) {
  const tournament = await db.tournament.findUnique({
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

  if (!tournament) {
    return null;
  }

  return {
    ...tournament,
    lifecycle: await buildTournamentLifecycle(tournament, db),
  };
}

function assertNextStatus(
  currentStatus: TournamentStatusDTO,
  nextStatus: TournamentStatusDTO
) {
  const expectedNextStatus = NEXT_TOURNAMENT_STATUS[currentStatus];

  if (expectedNextStatus !== nextStatus) {
    throw new Error('Tournament status must advance one step at a time');
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
  return findTournamentWithLifecycle(id);
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

export async function setStatus(
  input: SetTournamentStatusDTO & { adminId: string }
) {
  return prisma.$transaction(async (tx) => {
    const tournament = await findTournamentWithLifecycle(input.id, tx);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    assertNextStatus(tournament.status, input.status);

    if (input.status === 'completed' && !tournament.lifecycle.canComplete) {
      throw new Error(
        'Tournament cannot be completed until every group has winner results'
      );
    }

    const updatedTournament = await tx.tournament.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    await recordTournamentActivity(
      {
        tournamentId: input.id,
        adminId: input.adminId,
        eventType: 'tournament.status_change',
        entityType: 'tournament',
        entityId: input.id,
        payload: {
          fromStatus: tournament.status,
          toStatus: input.status,
        },
      },
      tx
    );

    return updatedTournament;
  });
}

export async function deleteTournament(id: string) {
  return await prisma.tournament.delete({ where: { id } });
}
