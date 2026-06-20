import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';

type TournamentLookupDatabase = Pick<typeof prisma, 'match' | 'tournament'>;

export const findTournamentWithLifecycleArgs = {
  include: {
    divisions: {
      include: {
        _count: { select: { tournamentAthletes: true, matches: true } },
      },
    },
    _count: {
      select: { divisions: true, matches: true, tournamentAthletes: true },
    },
  },
} as const satisfies Prisma.TournamentDefaultArgs;

export type TournamentWithLifecyclePayload = Prisma.TournamentGetPayload<
  typeof findTournamentWithLifecycleArgs
>;

async function buildTournamentLifecycle(
  tournament: TournamentWithLifecyclePayload,
  db: TournamentLookupDatabase
) {
  const hasGroups = tournament.divisions.length > 0;
  const hasMatches = tournament._count.matches > 0;
  const everyGroupHasMatches =
    hasGroups &&
    tournament.divisions.every((group) => group._count.matches > 0);

  if (!hasGroups || !hasMatches || !everyGroupHasMatches) {
    return { canComplete: false };
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

export async function findTournamentById(id: string) {
  return findTournamentWithLifecycle(id);
}
