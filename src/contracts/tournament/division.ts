export interface DivisionData {
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
  athleteProfile: { id: string; athleteCode: string | null };
}
