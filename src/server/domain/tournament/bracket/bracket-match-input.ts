import type { MatchStatus } from '@/lib/tournament/match/match-status';

export type BracketMatchInput = {
  kind: 'bracket';
  round: number;
  matchIndex: number;
  status: MatchStatus;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redLocked: boolean;
  blueLocked: boolean;
  groupId: string;
  tournamentId: string;
};
