import { MATCH_STATUS_RANK, MatchStatusSchema } from './match-status';
import type { MatchStatus } from './match-status';

export type MatchTransitionData = {
  redWins?: number;
  blueWins?: number;
  winnerId?: string | null;
  tournamentWinnerId?: string | null;
  status: MatchStatus;
};

export type ScoreTransitionMatch = {
  status: string;
  bestOf: number;
  redWins: number;
  blueWins: number;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  winnerId: string | null;
  tournamentWinnerId: string | null;
};

function pickScoreWinner(
  match: ScoreTransitionMatch,
  redWins: number,
  blueWins: number,
  winsNeeded: number
): {
  tournamentAthleteId: string | null;
  athleteProfileId: string | null;
} | null {
  if (redWins >= winsNeeded) {
    return {
      tournamentAthleteId: match.redTournamentAthleteId,
      athleteProfileId: match.redAthleteId,
    };
  }
  if (blueWins >= winsNeeded) {
    return {
      tournamentAthleteId: match.blueTournamentAthleteId,
      athleteProfileId: match.blueAthleteId,
    };
  }
  return null;
}

export function getScoreTransition(input: {
  match: ScoreTransitionMatch;
  redWins: number;
  blueWins: number;
}): {
  data: MatchTransitionData;
  clearAdvancement: boolean;
  advancedWinnerId: string | null;
} {
  const winsNeeded = Math.ceil(input.match.bestOf / 2);
  const hadCompleted =
    input.match.status === 'complete' ||
    input.match.redWins >= winsNeeded ||
    input.match.blueWins >= winsNeeded;

  const winner = pickScoreWinner(
    input.match,
    input.redWins,
    input.blueWins,
    winsNeeded
  );

  const status: MatchStatus = winner
    ? 'complete'
    : input.redWins > 0 || input.blueWins > 0
      ? 'active'
      : input.match.redTournamentAthleteId &&
          input.match.blueTournamentAthleteId
        ? 'pending'
        : 'active';

  const advancedWinnerId =
    status === 'complete' && winner?.tournamentAthleteId
      ? winner.tournamentAthleteId
      : null;

  return {
    data: {
      redWins: input.redWins,
      blueWins: input.blueWins,
      winnerId: winner?.athleteProfileId ?? null,
      tournamentWinnerId: winner?.tournamentAthleteId ?? null,
      status,
    },
    clearAdvancement:
      status !== 'complete' &&
      hadCompleted &&
      input.match.tournamentWinnerId != null,
    advancedWinnerId,
  };
}

export type AdminStatusTransitionMatch = {
  status: string;
  tournamentWinnerId: string | null;
};

export function getAdminStatusTransition(input: {
  match: AdminStatusTransitionMatch;
  status: MatchStatus;
}): {
  data: MatchTransitionData;
  clearAdvancement: boolean;
  clearedScores: boolean;
} {
  const current = MatchStatusSchema.parse(input.match.status);
  const isDowngrade =
    MATCH_STATUS_RANK[input.status] < MATCH_STATUS_RANK[current];

  return {
    data: {
      status: input.status,
      ...(isDowngrade
        ? {
            redWins: 0,
            blueWins: 0,
            winnerId: null,
            tournamentWinnerId: null,
          }
        : {}),
    },
    clearAdvancement: isDowngrade && input.match.tournamentWinnerId != null,
    clearedScores: isDowngrade,
  };
}

export type WinnerOverrideMatch = {
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
};

export function getWinnerOverrideTransition(input: {
  match: WinnerOverrideMatch;
  winnerSide: 'red' | 'blue';
}): {
  data: MatchTransitionData;
  advancedWinnerId: string | null;
} {
  const winnerId =
    input.winnerSide === 'red'
      ? input.match.redAthleteId
      : input.match.blueAthleteId;
  const tournamentWinnerId =
    input.winnerSide === 'red'
      ? input.match.redTournamentAthleteId
      : input.match.blueTournamentAthleteId;

  return {
    data: {
      winnerId,
      tournamentWinnerId,
      status: 'complete',
    },
    advancedWinnerId: tournamentWinnerId,
  };
}
