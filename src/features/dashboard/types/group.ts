export type MatchStatus = 'pending' | 'active' | 'complete';

export interface GroupData {
  id: string;
  name: string;
  gender: string | null;
  beltMin: number | null;
  beltMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  thirdPlaceMatch: boolean;
  arenaIndex: number;
  _count: { tournamentAthletes: number; matches: number };
}

export interface TournamentAthleteData {
  id: string;
  tournamentId: string;
  athleteProfileId: string;
  groupId: string | null;
  seed: number | null;
  locked: boolean;
  status: string;
  notes: string | null;
  name: string;
  gender: string;
  beltLevel: number;
  weight: number;
  affiliation: string;
  image: string | null;
  athleteProfile: { id: string; athleteCode: string | null };
}

export interface MatchData {
  id: string;
  round: number;
  matchIndex: number;
  status: MatchStatus;
  bestOf: number;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redWins: number;
  blueWins: number;
  winnerId: string | null;
  winnerTournamentAthleteId: string | null;
  redLocked: boolean;
  blueLocked: boolean;
  groupId: string;
  tournamentId: string;
  arenaSequenceRank?: number | null;
}
