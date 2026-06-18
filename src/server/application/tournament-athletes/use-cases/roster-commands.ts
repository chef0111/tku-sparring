export type ListTournamentAthletesQuery = {
  tournamentId: string;
  groupId?: string;
  unassignedOnly?: boolean;
  status?: 'selected' | 'assigned' | 'eliminated';
  page: number;
  perPage: number;
  query?: string;
  gender?: Array<'M' | 'F'>;
  beltLevels?: Array<number>;
  beltLevelMin?: number;
  beltLevelMax?: number;
  weightMin?: number;
  weightMax?: number;
  sorting: Array<{ id: string; desc: boolean }>;
};

export type BulkAddAthletesCommand = {
  tournamentId: string;
  athleteProfileIds: Array<string>;
  autoAssign: boolean;
  adminId: string;
};

export type UpdateTournamentAthleteCommand = {
  id: string;
  groupId?: string | null;
  status?: 'selected' | 'assigned' | 'eliminated';
  seed?: number | null;
  locked?: boolean;
  notes?: string | null;
};

export type RemoveTournamentAthleteCommand = { id: string };
export type BulkRemoveTournamentAthletesCommand = { ids: Array<string> };
