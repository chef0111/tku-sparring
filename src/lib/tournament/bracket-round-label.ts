export function getBracketRoundLabel(round: number, maxRound: number): string {
  if (round === maxRound) return 'Final';
  if (round === maxRound - 1) return 'Semifinal';
  return `Round ${round + 1}`;
}
