export const BO3_MAX_ROUNDS = 3;
export const BO3_WINS_NEEDED = 2;

export function completedRoundsFromWins(
  redWins: number,
  blueWins: number
): number {
  return redWins + blueWins;
}

export function deriveArenaCurrentRound(
  redWins: number,
  blueWins: number
): number {
  const completed = completedRoundsFromWins(redWins, blueWins);
  return Math.min(completed + 1, BO3_MAX_ROUNDS);
}
