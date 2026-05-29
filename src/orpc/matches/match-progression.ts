import type { PrismaClient } from '@prisma/client';
import {
  getSuccessorSlot,
  isRound0ByeMatch,
} from '@/lib/tournament/bracket-progression';
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

  const successor = getSuccessorSlot({
    round: match.round,
    matchIndex: match.matchIndex,
  });
  const winner = await db.tournamentAthlete.findUnique({
    where: { id: tournamentWinnerId },
  });

  const nextMatch = await db.match.findFirst({
    where: {
      kind: 'bracket',
      groupId: match.groupId,
      round: successor.round,
      matchIndex: successor.matchIndex,
    },
  });
  if (!nextMatch) return;

  await db.match.update({
    where: { id: nextMatch.id },
    data:
      successor.side === 'red'
        ? {
            redTournamentAthleteId: tournamentWinnerId,
            redAthleteId: winner?.athleteProfileId ?? null,
          }
        : {
            blueTournamentAthleteId: tournamentWinnerId,
            blueAthleteId: winner?.athleteProfileId ?? null,
          },
  });
}

export async function clearWinnerAdvancement(
  match: {
    groupId: string;
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

  const successor = getSuccessorSlot({
    round: match.round,
    matchIndex: match.matchIndex,
  });

  const nextMatch = await db.match.findFirst({
    where: {
      kind: 'bracket',
      groupId: match.groupId,
      round: successor.round,
      matchIndex: successor.matchIndex,
    },
  });

  if (!nextMatch) return;

  if (successor.side === 'red' && nextMatch.redTournamentAthleteId === wta) {
    await db.match.update({
      where: { id: nextMatch.id },
      data: { redTournamentAthleteId: null, redAthleteId: null },
    });
  } else if (
    successor.side === 'blue' &&
    nextMatch.blueTournamentAthleteId === wta
  ) {
    await db.match.update({
      where: { id: nextMatch.id },
      data: { blueTournamentAthleteId: null, blueAthleteId: null },
    });
  }
}

export async function applyRound0ByeAdvancement(
  groupId: string,
  _tournamentId: string,
  db: ProgressionDb = prisma
) {
  const round0 = await db.match.findMany({
    where: { groupId, round: 0 },
    orderBy: { matchIndex: 'asc' },
  });

  for (const match of round0) {
    if (!isRound0ByeMatch(match)) continue;

    const tournamentWinnerId =
      match.redTournamentAthleteId ?? match.blueTournamentAthleteId;
    const winnerProfileId = match.redAthleteId ?? match.blueAthleteId;

    await db.match.update({
      where: { id: match.id },
      data: {
        status: 'complete',
        tournamentWinnerId,
        winnerId: winnerProfileId,
        redWins: 0,
        blueWins: 0,
      },
    });

    await advanceWinner(match.id, tournamentWinnerId!, db);
  }
}
