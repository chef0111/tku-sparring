export type CustomSlotInput =
  | { mode: 'direct'; tournamentAthleteId: string }
  | { mode: 'winner'; feederMatchId: string }
  | { mode: 'loser'; feederMatchId: string };
