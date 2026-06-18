export type ClaimMatchCommand = {
  matchId: string;
  groupId: string;
  tournamentId: string;
  deviceId: string;
  userId: string;
};

export type ReleaseClaimCommand = {
  matchId: string;
  deviceId: string;
  userId: string;
};
