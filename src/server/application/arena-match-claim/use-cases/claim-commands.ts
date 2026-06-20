export type ClaimMatchCommand = {
  matchId: string;
  divisionId: string;
  tournamentId: string;
  deviceId: string;
  userId: string;
};

export type ReleaseClaimCommand = {
  matchId: string;
  deviceId: string;
  userId: string;
};
