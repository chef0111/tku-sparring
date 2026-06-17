export type GetLastSelectionQuery = {
  userId: string;
  deviceId: string;
};

export type SetLastSelectionCommand = {
  userId: string;
  deviceId: string;
  tournamentId?: string | null;
  groupId?: string | null;
  matchId?: string | null;
};

export type LastSelectionPayload = {
  tournamentId: string | null;
  groupId: string | null;
  matchId: string | null;
};
