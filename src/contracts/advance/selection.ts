/** Advance Settings list rows shared by client, oRPC, and server. */
export type SelectionDivisionRow = {
  id: string;
  name: string;
  tournamentId: string;
  status: 'draft' | 'active' | 'completed';
  arenaIndex: number;
  arenaLabel: string;
};

export type MatchClaimStatus = 'none' | 'held_by_me' | 'held_by_other';

export type SelectionMatchRow = {
  id: string;
  label: string;
  divisionId: string;
  status: string;
  redAthleteName: string | null;
  blueAthleteName: string | null;
  redAthleteImage: string | null;
  blueAthleteImage: string | null;
  disabled: boolean;
  claimStatus: MatchClaimStatus;
};
