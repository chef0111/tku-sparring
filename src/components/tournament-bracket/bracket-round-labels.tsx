import * as React from 'react';
import type {
  BracketCanvasLayout,
  MatchPosition,
} from '@/lib/tournament/bracket-layout';
import {
  oneSidedRoundLabelX,
  roundLabelCenterX,
} from '@/lib/tournament/bracket-layout';
import { ROUND_LABEL_Y } from '@/config/bracket';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

export interface BracketRoundLabelsProps {
  positions: Array<MatchPosition>;
  layoutMaxRound: number;
  layoutMode?: BracketCanvasLayout;
}

function hasWingInRound(
  positions: Array<MatchPosition>,
  round: number,
  wing: MatchPosition['wing'],
  layoutMaxRound: number
): boolean {
  return positions.some(
    (p) =>
      p.match.round === round &&
      p.wing === wing &&
      p.match.round <= layoutMaxRound
  );
}

export function BracketRoundLabels({
  positions,
  layoutMaxRound,
  layoutMode = 'two-sided',
}: BracketRoundLabelsProps) {
  if (positions.length === 0) return null;

  const roundNums = [
    ...new Set(
      positions
        .filter((p) => p.match.round <= layoutMaxRound)
        .map((p) => p.match.round)
    ),
  ].sort((a, b) => a - b);

  if (layoutMode === 'one-sided') {
    return roundNums.map((round) => (
      <text
        key={round}
        x={oneSidedRoundLabelX(round)}
        y={ROUND_LABEL_Y}
        textAnchor="middle"
        className="fill-muted-foreground text-sm font-semibold tracking-wider uppercase"
      >
        {getBracketRoundLabel(round, layoutMaxRound)}
      </text>
    ));
  }

  return roundNums.flatMap((round) => {
    const label = getBracketRoundLabel(round, layoutMaxRound);
    const nodes: Array<React.ReactElement> = [];

    if (hasWingInRound(positions, round, 'left', layoutMaxRound)) {
      nodes.push(
        <text
          key={`${round}-left`}
          x={roundLabelCenterX(round, 'left', layoutMaxRound)}
          y={ROUND_LABEL_Y}
          textAnchor="middle"
          className="fill-muted-foreground text-sm font-semibold tracking-wider uppercase"
        >
          {label}
        </text>
      );
    }
    if (
      round === layoutMaxRound &&
      hasWingInRound(positions, round, 'center', layoutMaxRound)
    ) {
      nodes.push(
        <text
          key={`${round}-center`}
          x={roundLabelCenterX(round, 'center', layoutMaxRound)}
          y={ROUND_LABEL_Y}
          textAnchor="middle"
          className="fill-muted-foreground text-sm font-semibold tracking-wider uppercase"
        >
          {label}
        </text>
      );
    }
    if (hasWingInRound(positions, round, 'right', layoutMaxRound)) {
      nodes.push(
        <text
          key={`${round}-right`}
          x={roundLabelCenterX(round, 'right', layoutMaxRound)}
          y={ROUND_LABEL_Y}
          textAnchor="middle"
          className="fill-muted-foreground text-sm font-semibold tracking-wider uppercase"
        >
          {label}
        </text>
      );
    }
    return nodes;
  });
}
