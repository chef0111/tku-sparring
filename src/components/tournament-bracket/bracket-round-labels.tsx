import * as React from 'react';
import type { MatchData } from '@/features/dashboard/types';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import { MATCH_W, PADDING, ROUND_GAP } from '@/lib/tournament/bracket-layout';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

export interface BracketRoundLabelsProps {
  positions: Array<MatchPosition>;
  matches: Array<MatchData>;
}

export function BracketRoundLabels({
  positions,
  matches,
}: BracketRoundLabelsProps) {
  if (matches.length === 0) return null;

  const maxRound = Math.max(...matches.map((m) => m.round));
  const roundNums = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const centerX = PADDING + maxRound * ROUND_GAP + MATCH_W / 2;

  const columns = new Map<
    string,
    { round: number; wing: 'left' | 'right' | 'center'; x: number }
  >();

  for (const pos of positions) {
    if (
      pos.wing === 'center' &&
      pos.match.matchIndex === 1 &&
      pos.match.round === maxRound
    ) {
      continue;
    }
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
    const label = getBracketRoundLabel(round, maxRound);
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
    if (centerCol && round === maxRound) {
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
