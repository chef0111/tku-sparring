import type {
  BulkRemoveTournamentAthletesCommand,
  ListTournamentAthletesQuery,
  RemoveTournamentAthleteCommand,
  UpdateTournamentAthleteCommand,
} from '../use-cases/roster-commands';

export type AthleteProfileRow = {
  id: string;
  name: string;
  gender: string;
  beltLevel: number;
  weight: number;
  affiliation: string;
  image: string | null;
};

export type CreatedProfileRow = AthleteProfileRow;

export type TournamentAthleteRow = {
  id: string;
  tournamentId: string;
  athleteProfileId: string;
  name: string;
  gender: string;
  beltLevel: number;
  weight: number;
  affiliation: string;
  image: string | null;
  status: string;
  divisionId: string | null;
  seed: number | null;
  locked: boolean;
  notes: string | null;
  createdAt: Date;
  athleteProfile: { id: string; athleteCode: string | null };
};

export type ListTournamentAthletesResult = {
  items: Array<TournamentAthleteRow>;
  total: number;
};

export type TournamentAthleteStore = {
  list: (
    query: ListTournamentAthletesQuery
  ) => Promise<ListTournamentAthletesResult>;
  findProfilesByIds: (ids: Array<string>) => Promise<Array<AthleteProfileRow>>;
  bulkCreate: (
    tournamentId: string,
    profiles: Array<AthleteProfileRow>
  ) => Promise<Array<CreatedProfileRow>>;
  update: (
    command: UpdateTournamentAthleteCommand
  ) => Promise<TournamentAthleteRow>;
  remove: (
    command: RemoveTournamentAthleteCommand
  ) => Promise<TournamentAthleteRow>;
  bulkRemove: (
    command: BulkRemoveTournamentAthletesCommand
  ) => Promise<{ removed: number }>;
  countAssigned: (
    tournamentId: string,
    profileIds: Array<string>
  ) => Promise<number>;
};
