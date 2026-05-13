import { Prisma } from '@prisma/client';
import { recordTournamentActivity } from '../activity/dal';
import { TournamentStatusSchema } from './dto';
import type {
  CreateTournamentDTO,
  ListTournamentsDTO,
  SetTournamentStatusDTO,
  TournamentStatusDTO,
  UpdateTournamentDTO,
} from './dto';
import { prisma } from '@/lib/db';
import { getNameSortKey } from '@/lib/sort/name-sort-key';

type SortableField = 'name' | 'status' | 'athletes' | 'createdAt';

type TournamentLookupDatabase = Pick<typeof prisma, 'match' | 'tournament'>;

const findTournamentWithLifecycleArgs =
  Prisma.validator<Prisma.TournamentDefaultArgs>()({
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

type TournamentWithLifecyclePayload = Prisma.TournamentGetPayload<
  typeof findTournamentWithLifecycleArgs
>;

export class TournamentDAL {
  private static readonly SORTABLE_FIELDS = new Set<SortableField>([
    'name',
    'status',
    'athletes',
    'createdAt',
  ]);

  private static readonly NEXT_TOURNAMENT_STATUS: Record<
    TournamentStatusDTO,
    TournamentStatusDTO | null
  > = {
    draft: 'active',
    active: 'completed',
    completed: null,
  };

  private static toSortField(field?: string): SortableField {
    if (field && TournamentDAL.SORTABLE_FIELDS.has(field as SortableField))
      return field as SortableField;
    return 'createdAt';
  }

  private static toOrderBy(
    field?: string,
    direction: Prisma.SortOrder = 'desc'
  ): Prisma.TournamentOrderByWithRelationInput {
    switch (TournamentDAL.toSortField(field)) {
      case 'athletes':
        return {
          tournamentAthletes: {
            _count: direction,
          },
        };
      case 'name':
        return { nameSortKey: direction };
      case 'status':
        return { status: direction };
      case 'createdAt':
      default:
        return { createdAt: direction };
    }
  }

  private static async buildTournamentLifecycle(
    tournament: TournamentWithLifecyclePayload,
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

  private static async findTournamentWithLifecycle(
    id: string,
    db: TournamentLookupDatabase = prisma
  ) {
    const tournament = await db.tournament.findUnique({
      where: { id },
      ...findTournamentWithLifecycleArgs,
    });

    if (!tournament) {
      return null;
    }

    return {
      ...tournament,
      lifecycle: await TournamentDAL.buildTournamentLifecycle(tournament, db),
    };
  }

  private static assertNextStatus(
    currentStatus: TournamentStatusDTO,
    nextStatus: TournamentStatusDTO
  ) {
    const expectedNextStatus =
      TournamentDAL.NEXT_TOURNAMENT_STATUS[currentStatus];

    if (expectedNextStatus !== nextStatus) {
      throw new Error('Tournament status must advance one step at a time');
    }
  }

  static async findMany(input: ListTournamentsDTO) {
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
        orderBy: TournamentDAL.toOrderBy(sort, sortDir),
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

  static async findById(id: string) {
    return TournamentDAL.findTournamentWithLifecycle(id);
  }

  static async create(data: CreateTournamentDTO) {
    return await prisma.tournament.create({
      data: {
        ...data,
        nameSortKey: getNameSortKey(data.name),
      },
    });
  }

  static async update(id: string, data: Omit<UpdateTournamentDTO, 'id'>) {
    return await prisma.tournament.update({
      where: { id },
      data: {
        ...data,
        ...(data.name !== undefined
          ? { nameSortKey: getNameSortKey(data.name) }
          : {}),
      },
    });
  }

  static async setStatus(input: SetTournamentStatusDTO & { adminId: string }) {
    return prisma.$transaction(async (tx) => {
      const tournament = await TournamentDAL.findTournamentWithLifecycle(
        input.id,
        tx
      );

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const currentStatus = TournamentStatusSchema.parse(tournament.status);
      TournamentDAL.assertNextStatus(currentStatus, input.status);

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
            fromStatus: currentStatus,
            toStatus: input.status,
          },
        },
        tx
      );

      return updatedTournament;
    });
  }

  static async deleteTournament(id: string) {
    return await prisma.tournament.delete({ where: { id } });
  }
}
