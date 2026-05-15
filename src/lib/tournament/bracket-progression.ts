export type BracketSide = 'red' | 'blue';

export function getSuccessorSlot(input: {
  round: number;
  matchIndex: number;
}): {
  round: number;
  matchIndex: number;
  side: BracketSide;
} {
  return {
    round: input.round + 1,
    matchIndex: Math.floor(input.matchIndex / 2),
    side: input.matchIndex % 2 === 0 ? 'red' : 'blue',
  };
}

export function isRound0ByeMatch(input: {
  round: number;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
}): boolean {
  return (
    input.round === 0 &&
    ((input.redTournamentAthleteId != null &&
      input.blueTournamentAthleteId == null) ||
      (input.redTournamentAthleteId == null &&
        input.blueTournamentAthleteId != null))
  );
}
