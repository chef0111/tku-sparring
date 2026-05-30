import * as React from 'react';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import { MATCH_W, PADDING, ROUND_GAP } from '@/lib/tournament/bracket-layout';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

export interface BracketRoundLabelsProps {
  positions: Array<MatchPosition>;
  layoutMaxRound: number;
}

export function BracketRoundLabels({
  positions,
  layoutMaxRound,
}: BracketRoundLabelsProps) {
  if (positions.length === 0) return null;

  const roundNums = [
    ...new Set(
      positions
        .filter((p) => p.match.round <= layoutMaxRound)
        .map((p) => p.match.round)
    ),
  ].sort((a, b) => a - b);

  const centerX = PADDING + layoutMaxRound * ROUND_GAP + MATCH_W / 2;

  const columns = new Map<
    string,
    { round: number; wing: 'left' | 'right' | 'center'; x: number }
  >();

  for (const pos of positions) {
    if (pos.match.round > layoutMaxRound) continue;
    const key = `${pos.match.round}-${pos.wing}`;
    const midX = pos.x + MATCH_W / 2;
    const existing = columns.get(key);
    if (
      !existing ||
      Math.abs(midX - centerX) < Math.abs(existing.x - centerX)
    ) {
      columns.set(key, { round: pos.match.round, wing: pos.wing, x: midX });
    }
  }

  return roundNums.flatMap((round) => {
    const label = getBracketRoundLabel(round, layoutMaxRound);
    const leftCol = columns.get(`${round}-left`);
    const rightCol = columns.get(`${round}-right`);
    const centerCol = columns.get(`${round}-center`);
    const nodes: Array<React.ReactElement> = [];

    if (leftCol) {
      nodes.push(
        <text
          key={`${round}-left`}
          x={leftCol.x}
          y={10}
          textAnchor="middle"
          className="fill-muted-foreground text-sm font-semibold tracking-wider uppercase"
        >
          {label}
        </text>
      );
    }
    if (centerCol && round === layoutMaxRound) {
      nodes.push(
        <text
          key={`${round}-center`}
          x={centerCol.x}
          y={10}
          textAnchor="middle"
          className="fill-muted-foreground text-sm font-semibold tracking-wider uppercase"
        >
          {label}
        </text>
      );
    }
    if (rightCol) {
      nodes.push(
        <text
          key={`${round}-right`}
          x={rightCol.x}
          y={10}
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
