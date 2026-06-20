import {
  getSuccessorSlot,
  isRound0ByeMatch,
  resolveAdvanceSide,
} from '@/lib/tournament/bracket/bracket-progression';

export type BracketPosition = {
  divisionId: string;
  round: number;
  matchIndex: number;
};

export type SuccessorMatch = {
  cornersSwapped: boolean;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
};

export function successorWhere(position: BracketPosition) {
  const slot = getSuccessorSlot(position);
  return {
    kind: 'bracket' as const,
    divisionId: position.divisionId,
    round: slot.round,
    matchIndex: slot.matchIndex,
  };
}

export function winnerAdvancePatch(
  source: Pick<BracketPosition, 'round' | 'matchIndex'>,
  successor: Pick<SuccessorMatch, 'cornersSwapped'>,
  winner: { tournamentAthleteId: string; athleteProfileId: string | null }
) {
  const slot = getSuccessorSlot(source);
  const side = resolveAdvanceSide(slot.side, successor.cornersSwapped);
  if (side === 'red') {
    return {
      redTournamentAthleteId: winner.tournamentAthleteId,
      redAthleteId: winner.athleteProfileId,
    };
  }
  return {
    blueTournamentAthleteId: winner.tournamentAthleteId,
    blueAthleteId: winner.athleteProfileId,
  };
}

export function clearAdvancePatch(
  source: Pick<BracketPosition, 'round' | 'matchIndex'> & {
    tournamentWinnerId: string;
  },
  successor: SuccessorMatch
) {
  const slot = getSuccessorSlot(source);
  const side = resolveAdvanceSide(slot.side, successor.cornersSwapped);
  if (
    side === 'red' &&
    successor.redTournamentAthleteId === source.tournamentWinnerId
  ) {
    return { redTournamentAthleteId: null, redAthleteId: null };
  }
  if (
    side === 'blue' &&
    successor.blueTournamentAthleteId === source.tournamentWinnerId
  ) {
    return { blueTournamentAthleteId: null, blueAthleteId: null };
  }
  return null;
}

export type Round0ByeRow = {
  id: string;
  round: number;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redAthleteId: string | null;
  blueAthleteId: string | null;
};

export function round0ByePlan(row: Round0ByeRow) {
  if (!isRound0ByeMatch(row)) return null;

  const tournamentWinnerId =
    row.redTournamentAthleteId ?? row.blueTournamentAthleteId;
  if (!tournamentWinnerId) return null;

  return {
    matchId: row.id,
    completion: {
      status: 'complete' as const,
      tournamentWinnerId,
      winnerId: row.redAthleteId ?? row.blueAthleteId,
      redWins: 0,
      blueWins: 0,
    },
    advanceWinnerId: tournamentWinnerId,
  };
}
