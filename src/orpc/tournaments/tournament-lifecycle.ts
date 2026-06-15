import { recordTournamentActivity } from '../activity/dal';
import { TournamentStatusSchema } from './dto';
import type {
  CreateTournamentDTO,
  SetTournamentStatusDTO,
  TournamentStatusDTO,
  UpdateTournamentDTO,
} from './dto';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getNameSortKey } from '@/lib/sort/name-sort-key';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-realtime-broadcast';

type TournamentLookupDatabase = Pick<typeof prisma, 'match' | 'tournament'>;

export const findTournamentWithLifecycleArgs = {
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
} as const satisfies Prisma.TournamentDefaultArgs;

export type TournamentWithLifecyclePayload = Prisma.TournamentGetPayload<
  typeof findTournamentWithLifecycleArgs
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

export async function findTournamentWithLifecycle(
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

export async function findTournamentById(id: string) {
  return findTournamentWithLifecycle(id);
}

export async function createTournament(data: CreateTournamentDTO) {
  return prisma.tournament.create({
    data: {
      ...data,
      nameSortKey: getNameSortKey(data.name),
    },
  });
}

export async function updateTournament(
  id: string,
  data: Omit<UpdateTournamentDTO, 'id'>
) {
  return prisma.tournament.update({
    where: { id },
    data: {
      ...data,
      ...(data.name !== undefined
        ? { nameSortKey: getNameSortKey(data.name) }
        : {}),
    },
  });
}

export async function setTournamentStatus(
  input: SetTournamentStatusDTO & { adminId: string }
) {
  const updatedTournament = await prisma.$transaction(async (tx) => {
    const tournament = await findTournamentWithLifecycle(input.id, tx);

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const currentStatus = TournamentStatusSchema.parse(tournament.status);
    const force = Boolean(input.force);

    if (!force) {
      assertNextStatus(currentStatus, input.status);

      if (input.status === 'completed' && !tournament.lifecycle.canComplete) {
        throw new Error(
          'Tournament cannot be completed until every group has winner results'
        );
      }
    }

    const updated = await tx.tournament.update({
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

    return updated;
  });
  publishSelectionInvalidate(input.id);
  return updatedTournament;
}

export async function deleteTournament(id: string) {
  return prisma.tournament.delete({ where: { id } });
}
