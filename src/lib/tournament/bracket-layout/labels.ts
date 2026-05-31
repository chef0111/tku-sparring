import { oneSidedRoundLabelX, roundLabelCenterX } from './coords';
import type {
  BracketCanvasLayout,
  BracketWing,
  MatchPosition,
  RoundLabelPlacement,
} from './types';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

export { oneSidedRoundLabelX, roundLabelCenterX } from './coords';

function hasWingInRound(
  positions: Array<MatchPosition>,
  round: number,
  wing: BracketWing,
  layoutMaxRound: number
): boolean {
  return positions.some(
    (p) =>
      p.match.round === round &&
      p.wing === wing &&
      p.match.round <= layoutMaxRound
  );
}

export function roundLabelPlacements(
  positions: Array<MatchPosition>,
  layoutMaxRound: number,
  layoutMode: BracketCanvasLayout = 'two-sided'
): Array<RoundLabelPlacement> {
  if (positions.length === 0) return [];

  const roundNums = [
    ...new Set(
      positions
        .filter((p) => p.match.round <= layoutMaxRound)
        .map((p) => p.match.round)
    ),
  ].sort((a, b) => a - b);

  const placements: Array<RoundLabelPlacement> = [];

  for (const round of roundNums) {
    const label = getBracketRoundLabel(round, layoutMaxRound);

    if (layoutMode === 'one-sided') {
      placements.push({
        key: String(round),
        x: oneSidedRoundLabelX(round, layoutMaxRound),
        label,
      });
      continue;
    }

    if (hasWingInRound(positions, round, 'left', layoutMaxRound)) {
      placements.push({
        key: `${round}-left`,
        x: roundLabelCenterX(round, 'left', layoutMaxRound),
        label,
      });
    }
    if (
      round === layoutMaxRound &&
      hasWingInRound(positions, round, 'center', layoutMaxRound)
    ) {
      placements.push({
        key: `${round}-center`,
        x: roundLabelCenterX(round, 'center', layoutMaxRound),
        label,
      });
    }
    if (hasWingInRound(positions, round, 'right', layoutMaxRound)) {
      placements.push({
        key: `${round}-right`,
        x: roundLabelCenterX(round, 'right', layoutMaxRound),
        label,
      });
    }
  }

  return placements;
}
