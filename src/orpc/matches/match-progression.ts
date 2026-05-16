import {
  getSuccessorSlot,
  isRound0ByeMatch,
} from '@/lib/tournament/bracket-progression';
import { prisma } from '@/lib/db';

export async function advanceWinner(
  matchId: string,
  winnerTournamentAthleteId: string
) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.kind === 'custom') return;

  const successor = getSuccessorSlot({
    round: match.round,
    matchIndex: match.matchIndex,
  });
  const winner = await prisma.tournamentAthlete.findUnique({
    where: { id: winnerTournamentAthleteId },
  });

  const nextMatch = await prisma.match.findFirst({
    where: {
      groupId: match.groupId,
      round: successor.round,
      matchIndex: successor.matchIndex,
    },
  });
  if (!nextMatch) return;

  await prisma.match.update({
    where: { id: nextMatch.id },
    data:
      successor.side === 'red'
        ? {
            redTournamentAthleteId: winnerTournamentAthleteId,
            redAthleteId: winner?.athleteProfileId ?? null,
          }
        : {
            blueTournamentAthleteId: winnerTournamentAthleteId,
            blueAthleteId: winner?.athleteProfileId ?? null,
          },
  });
}

export async function clearWinnerAdvancement(match: {
  groupId: string;
  round: number;
  matchIndex: number;
  winnerTournamentAthleteId: string | null;
  kind?: string;
}) {
  if (match.kind === 'custom') return;

  const wta = match.winnerTournamentAthleteId;
  if (!wta) return;

  const successor = getSuccessorSlot({
    round: match.round,
    matchIndex: match.matchIndex,
  });

  const nextMatch = await prisma.match.findFirst({
    where: {
      groupId: match.groupId,
      round: successor.round,
      matchIndex: successor.matchIndex,
    },
  });

  if (!nextMatch) return;

  if (successor.side === 'red' && nextMatch.redTournamentAthleteId === wta) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { redTournamentAthleteId: null, redAthleteId: null },
    });
  } else if (
    successor.side === 'blue' &&
    nextMatch.blueTournamentAthleteId === wta
  ) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { blueTournamentAthleteId: null, blueAthleteId: null },
    });
  }
}

export async function applyRound0ByeAdvancement(
  groupId: string,
  _tournamentId: string
) {
  const round0 = await prisma.match.findMany({
    where: { groupId, round: 0 },
    orderBy: { matchIndex: 'asc' },
  });

  for (const match of round0) {
    if (!isRound0ByeMatch(match)) continue;

    const winnerTournamentAthleteId =
      match.redTournamentAthleteId ?? match.blueTournamentAthleteId;
    const winnerProfileId = match.redAthleteId ?? match.blueAthleteId;

    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: 'complete',
        winnerTournamentAthleteId,
        winnerId: winnerProfileId,
        redWins: 0,
        blueWins: 0,
      },
    });

    await advanceWinner(match.id, winnerTournamentAthleteId!);
  }
}
