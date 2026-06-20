import type { PrismaClient } from '@/generated/prisma/client';
import {
  clearAdvancePatch,
  round0ByePlan,
  successorWhere,
  winnerAdvancePatch,
} from '@/server/domain/tournament/match/match-progression';
import { prisma } from '@/lib/db';

export type ProgressionDb = Pick<PrismaClient, 'match' | 'tournamentAthlete'>;

export async function advanceWinner(
  matchId: string,
  tournamentWinnerId: string,
  db: ProgressionDb = prisma
) {
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.kind === 'custom') return;

  const winner = await db.tournamentAthlete.findUnique({
    where: { id: tournamentWinnerId },
  });

  const nextMatch = await db.match.findFirst({
    where: successorWhere(match),
  });
  if (!nextMatch) return;

  await db.match.update({
    where: { id: nextMatch.id },
    data: winnerAdvancePatch(match, nextMatch, {
      tournamentAthleteId: tournamentWinnerId,
      athleteProfileId: winner?.athleteProfileId ?? null,
    }),
  });
}

export async function clearWinnerAdvancement(
  match: {
    divisionId: string;
    round: number;
    matchIndex: number;
    tournamentWinnerId: string | null;
    kind?: string;
  },
  db: ProgressionDb = prisma
) {
  if (match.kind === 'custom') return;

  const wta = match.tournamentWinnerId;
  if (!wta) return;

  const nextMatch = await db.match.findFirst({
    where: successorWhere(match),
  });
  if (!nextMatch) return;

  const patch = clearAdvancePatch(
    {
      round: match.round,
      matchIndex: match.matchIndex,
      tournamentWinnerId: wta,
    },
    nextMatch
  );
  if (!patch) return;

  await db.match.update({
    where: { id: nextMatch.id },
    data: patch,
  });
}

export async function applyRound0ByeAdvancement(
  divisionId: string,
  _tournamentId: string,
  db: ProgressionDb = prisma
) {
  const round0 = await db.match.findMany({
    where: { divisionId, round: 0 },
    orderBy: { matchIndex: 'asc' },
  });

  for (const match of round0) {
    const plan = round0ByePlan(match);
    if (!plan) continue;

    await db.match.update({
      where: { id: plan.matchId },
      data: plan.completion,
    });

    await advanceWinner(plan.matchId, plan.advanceWinnerId, db);
  }
}
