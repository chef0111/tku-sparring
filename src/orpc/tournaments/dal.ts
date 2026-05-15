import { Prisma } from '@prisma/client';
import { recordTournamentActivity } from '../activity/dal';
import { TournamentStatusSchema } from './dto';
import type {
  CreateTournamentDTO,
  EnsureArenaSlotDTO,
  ListTournamentsDTO,
  MoveGroupArenaDTO,
  RetireArenaDTO,
  SetArenaGroupOrderDTO,
  SetTournamentStatusDTO,
  TournamentStatusDTO,
  UpdateTournamentDTO,
} from './dto';
import {
  mergeArenaGroupOrderAfterCrossArenaMove,
  mergeArenaGroupOrderAfterRetireArena,
  patchArenaGroupOrderJson,
} from '@/lib/tournament/arena-group-order';
import { prisma } from '@/lib/db';
import { getNameSortKey } from '@/lib/sort/name-sort-key';
import { publishTournamentSelectionInvalidate } from '@/lib/tournament/tournament-sse-bus';

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
    const updatedTournament = await prisma.$transaction(async (tx) => {
      const tournament = await TournamentDAL.findTournamentWithLifecycle(
        input.id,
        tx
      );

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const currentStatus = TournamentStatusSchema.parse(tournament.status);
      const force = Boolean(input.force);

      if (!force) {
        TournamentDAL.assertNextStatus(currentStatus, input.status);

        if (input.status === 'completed' && !tournament.lifecycle.canComplete) {
          throw new Error(
            'Tournament cannot be completed until every group has winner results'
          );
        }
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
            ...(force ? { forced: true } : {}),
          },
        },
        tx
      );

      return updatedTournament;
    });
    publishTournamentSelectionInvalidate(input.id);
    return updatedTournament;
  }

  static async setArenaGroupOrder(input: SetArenaGroupOrderDTO) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
      select: {
        id: true,
        status: true,
        arenaGroupOrder: true,
        groups: { select: { id: true, arenaIndex: true } },
      },
    });
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    if (tournament.status !== 'draft') {
      throw new Error('Arena group order can only be changed in draft');
    }
    const onArena = tournament.groups.filter(
      (g) => g.arenaIndex === input.arenaIndex
    );
    const expected = new Set(onArena.map((g) => g.id));
    if (input.groupIds.length !== expected.size) {
      throw new Error(
        'Group list must include every group on this arena exactly once'
      );
    }
    for (const gid of input.groupIds) {
      if (!expected.has(gid)) {
        throw new Error(
          'Group list must include every group on this arena exactly once'
        );
      }
    }
    const nextJson = patchArenaGroupOrderJson(
      tournament.arenaGroupOrder,
      input.arenaIndex,
      input.groupIds
    );
    await prisma.tournament.update({
      where: { id: input.tournamentId },
      data: { arenaGroupOrder: nextJson },
    });
    const full = await TournamentDAL.findById(input.tournamentId);
    if (!full) {
      throw new Error('Tournament not found');
    }
    publishTournamentSelectionInvalidate(input.tournamentId);
    return full;
  }

  static async moveGroupBetweenArenas(input: MoveGroupArenaDTO) {
    if (input.fromArena === input.toArena) {
      throw new Error('Same-arena reorder uses setArenaGroupOrder');
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
      select: {
        id: true,
        status: true,
        arenaGroupOrder: true,
        groups: { select: { id: true, arenaIndex: true } },
      },
    });
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    if (tournament.status !== 'draft') {
      throw new Error('Arena assignment can only be changed in draft');
    }

    const group = tournament.groups.find((g) => g.id === input.groupId);
    if (!group) {
      throw new Error('Group not found on this tournament');
    }
    if (group.arenaIndex !== input.fromArena) {
      throw new Error('Group is not on the source arena');
    }

    const onToAll = tournament.groups.filter(
      (g) => g.arenaIndex === input.toArena
    );
    const maxInsert = onToAll.length;
    if (input.insertIndex < 0 || input.insertIndex > maxInsert) {
      throw new Error('Invalid insert index');
    }

    const nextJson = mergeArenaGroupOrderAfterCrossArenaMove({
      arenaGroupOrder: tournament.arenaGroupOrder,
      groups: tournament.groups,
      groupId: input.groupId,
      fromArena: input.fromArena,
      toArena: input.toArena,
      insertIndex: input.insertIndex,
    });

    await prisma.$transaction([
      prisma.group.update({
        where: { id: input.groupId },
        data: { arenaIndex: input.toArena },
      }),
      prisma.tournament.update({
        where: { id: input.tournamentId },
        data: { arenaGroupOrder: nextJson },
      }),
    ]);

    const full = await TournamentDAL.findById(input.tournamentId);
    if (!full) {
      throw new Error('Tournament not found');
    }
    publishTournamentSelectionInvalidate(input.tournamentId);
    return full;
  }

  static async ensureArenaSlot(input: EnsureArenaSlotDTO) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
      select: {
        id: true,
        status: true,
        arenaGroupOrder: true,
        groups: { select: { id: true, arenaIndex: true } },
      },
    });
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    if (tournament.status !== 'draft') {
      throw new Error('Arena slots can only be changed in draft');
    }
    if (input.arenaIndex < 1 || input.arenaIndex > 3) {
      throw new Error('Arena index must be between 1 and 3');
    }
    const onArena = tournament.groups.filter(
      (g) => g.arenaIndex === input.arenaIndex
    );
    if (onArena.length > 0) {
      throw new Error('That arena already has groups');
    }
    const nextJson = patchArenaGroupOrderJson(
      tournament.arenaGroupOrder,
      input.arenaIndex,
      []
    );
    await prisma.tournament.update({
      where: { id: input.tournamentId },
      data: { arenaGroupOrder: nextJson },
    });
    const full = await TournamentDAL.findById(input.tournamentId);
    if (!full) {
      throw new Error('Tournament not found');
    }
    publishTournamentSelectionInvalidate(input.tournamentId);
    return full;
  }

  static async retireArena(input: RetireArenaDTO) {
    if (input.fromArena === input.toArena) {
      throw new Error('Target arena must differ from the arena being removed');
    }
    if (input.fromArena < 1 || input.fromArena > 3) {
      throw new Error('Invalid source arena');
    }
    if (input.toArena < 1 || input.toArena > 3) {
      throw new Error('Invalid target arena');
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
      select: {
        id: true,
        status: true,
        arenaGroupOrder: true,
        groups: { select: { id: true, arenaIndex: true } },
      },
    });
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    if (tournament.status !== 'draft') {
      throw new Error('Arena assignment can only be changed in draft');
    }

    const nextJson = mergeArenaGroupOrderAfterRetireArena({
      arenaGroupOrder: tournament.arenaGroupOrder,
      groups: tournament.groups,
      fromArena: input.fromArena,
      toArena: input.toArena,
    });

    await prisma.$transaction([
      prisma.group.updateMany({
        where: {
          tournamentId: input.tournamentId,
          arenaIndex: input.fromArena,
        },
        data: { arenaIndex: input.toArena },
      }),
      prisma.tournament.update({
        where: { id: input.tournamentId },
        data: { arenaGroupOrder: nextJson },
      }),
    ]);

    const full = await TournamentDAL.findById(input.tournamentId);
    if (!full) {
      throw new Error('Tournament not found');
    }
    publishTournamentSelectionInvalidate(input.tournamentId);
    return full;
  }

  static async deleteTournament(id: string) {
    return await prisma.tournament.delete({ where: { id } });
  }
}
