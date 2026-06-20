export type GetLastSelectionQuery = {
  userId: string;
  deviceId: string;
};

export type SetLastSelectionCommand = {
  userId: string;
  deviceId: string;
  tournamentId?: string | null;
  divisionId?: string | null;
  matchId?: string | null;
};

export type LastSelectionPayload = {
  tournamentId: string | null;
  divisionId: string | null;
  matchId: string | null;
};
