export type MatchStatus = 'pending' | 'active' | 'complete';

export type MatchKind = 'bracket' | 'custom';

export interface MatchData {
  id: string;
  kind: MatchKind;
  displayLabel: string | null;
  round: number;
  matchIndex: number;
  status: MatchStatus;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redWins: number;
  blueWins: number;
  winnerId: string | null;
  tournamentWinnerId: string | null;
  redLocked: boolean;
  blueLocked: boolean;
  cornersSwapped: boolean;
  updatedAt: Date;
  groupId: string;
  tournamentId: string;
  arenaSequenceRank?: number | null;
}
