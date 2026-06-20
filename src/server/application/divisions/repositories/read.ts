export type DivisionCountSummary = {
  tournamentAthletes: number;
  matches: number;
};

export type DivisionListRow = {
  id: string;
  tournamentId: string;
  name: string;
  gender: string | null;
  beltMin: number | null;
  beltMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  thirdPlaceMatch: boolean;
  arenaIndex: number;
  createdAt: Date;
  updatedAt: Date;
  _count: DivisionCountSummary;
};

export type DivisionAthleteProfileRef = {
  id: string;
  athleteCode: string | null;
};

export type DivisionTournamentAthleteRow = {
  id: string;
  tournamentId: string;
  athleteProfileId: string;
  divisionId: string | null;
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
  athleteProfile: DivisionAthleteProfileRef;
};

export type DivisionMatchRow = {
  id: string;
  kind: string;
  displayLabel: string | null;
  round: number;
  matchIndex: number;
  status: string;
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
  divisionId: string;
  tournamentId: string;
  arenaSequenceRank?: number | null;
};

export type DivisionDetailRow = DivisionListRow & {
  tournamentAthletes: Array<DivisionTournamentAthleteRow>;
  matches: Array<DivisionMatchRow>;
};

export type DivisionReadStore = {
  listByTournament: (tournamentId: string) => Promise<Array<DivisionListRow>>;
  findById: (id: string) => Promise<DivisionDetailRow | null>;
};
