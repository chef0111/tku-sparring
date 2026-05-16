import type { MatchStatusDTO } from '@/orpc/matches/dto';
import { MatchStatusSchema } from '@/orpc/matches/dto';
import { BO3_WINS_NEEDED } from '@/lib/tournament/bo3';

export type MatchTransitionData = {
  redWins?: number;
  blueWins?: number;
  winnerId?: string | null;
  winnerTournamentAthleteId?: string | null;
  status: MatchStatusDTO;
};

export type ScoreTransitionMatch = {
  status: string;
  redWins: number;
  blueWins: number;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  winnerId: string | null;
  winnerTournamentAthleteId: string | null;
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
  advanceWinnerTournamentAthleteId: string | null;
} {
  const winsNeeded = BO3_WINS_NEEDED;
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

  const status: MatchStatusDTO = winner
    ? 'complete'
    : input.redWins > 0 || input.blueWins > 0
      ? 'active'
      : input.match.redTournamentAthleteId &&
          input.match.blueTournamentAthleteId
        ? 'pending'
        : 'active';

  const advanceWinnerTournamentAthleteId =
    status === 'complete' && winner?.tournamentAthleteId
      ? winner.tournamentAthleteId
      : null;

  return {
    data: {
      redWins: input.redWins,
      blueWins: input.blueWins,
      winnerId: winner?.athleteProfileId ?? null,
      winnerTournamentAthleteId: winner?.tournamentAthleteId ?? null,
      status,
    },
    clearAdvancement:
      status !== 'complete' &&
      hadCompleted &&
      input.match.winnerTournamentAthleteId != null,
    advanceWinnerTournamentAthleteId,
  };
}

export type AdminStatusTransitionMatch = {
  status: string;
  winnerTournamentAthleteId: string | null;
};

const MATCH_STATUS_RANK: Record<MatchStatusDTO, number> = {
  pending: 0,
  active: 1,
  complete: 2,
};

export function getAdminStatusTransition(input: {
  match: AdminStatusTransitionMatch;
  status: MatchStatusDTO;
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
            winnerTournamentAthleteId: null,
          }
        : {}),
    },
    clearAdvancement:
      isDowngrade && input.match.winnerTournamentAthleteId != null,
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
  advanceWinnerTournamentAthleteId: string | null;
} {
  const winnerId =
    input.winnerSide === 'red'
      ? input.match.redAthleteId
      : input.match.blueAthleteId;
  const winnerTournamentAthleteId =
    input.winnerSide === 'red'
      ? input.match.redTournamentAthleteId
      : input.match.blueTournamentAthleteId;

  return {
    data: {
      winnerId,
      winnerTournamentAthleteId,
      status: 'complete',
    },
    advanceWinnerTournamentAthleteId: winnerTournamentAthleteId,
  };
}
