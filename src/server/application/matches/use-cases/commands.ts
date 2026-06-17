import type { MatchStatus } from '@/lib/tournament/match/match-status';

export type UpdateMatchScoreCommand = {
  matchId: string;
  redWins: number;
  blueWins: number;
  adminId: string;
};

export type SetMatchWinnerCommand = {
  matchId: string;
  winnerSide: 'red' | 'blue';
  reason?: string;
  adminId: string;
};

export type AdminSetMatchStatusCommand = {
  matchId: string;
  status: MatchStatus;
  adminId: string;
};
