export type GroupCountSummary = {
  tournamentAthletes: number;
  matches: number;
};

export type GroupListRow = {
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
  _count: GroupCountSummary;
};

export type GroupAthleteProfileRef = {
  id: string;
  athleteCode: string | null;
};

export type GroupTournamentAthleteRow = {
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
  athleteProfile: GroupAthleteProfileRef;
};

export type GroupMatchRow = {
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
  groupId: string;
  tournamentId: string;
  arenaSequenceRank?: number | null;
};

export type GroupDetailRow = GroupListRow & {
  tournamentAthletes: Array<GroupTournamentAthleteRow>;
  matches: Array<GroupMatchRow>;
};

export type GroupReadStore = {
  listByTournament: (tournamentId: string) => Promise<Array<GroupListRow>>;
  findById: (id: string) => Promise<GroupDetailRow | null>;
};
