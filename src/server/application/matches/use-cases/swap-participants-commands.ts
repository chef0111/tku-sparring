export type SwapParticipantsCommand = {
  matchId: string;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  adminId: string;
};
