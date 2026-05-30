import * as React from 'react';
import { BracketConnectors } from './bracket-connectors';
import { BracketProvider } from './bracket-context';
import { BracketFinalMatchNode } from './bracket-final-match-node';
import { BracketMatchNode } from './bracket-match-node';
import { BracketRoundLabels } from './bracket-round-labels';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import type { BracketLayoutResult } from '@/lib/tournament/bracket-layout';
import {
  MATCH_HEADER_ABOVE,
  MATCH_W,
  buildTwoSidedConnectors,
  buildTwoSidedLayout,
  isBracketFinal,
} from '@/lib/tournament/bracket-layout';

export interface BracketProps {
  matches: Array<MatchData>;
  thirdPlaceMatch: boolean;
  athleteMap: Map<string, TournamentAthleteData>;
  matchLabel: ReadonlyMap<string, number | null>;
  readOnly: boolean;
  onSlotClick: (match: MatchData) => void;
  onToggleLock: (
    matchId: string,
    side: 'red' | 'blue',
    locked: boolean
  ) => void;
  /** When set, skips a second layout pass (e.g. from BracketCanvas pan/zoom). */
  layout?: BracketLayoutResult;
}

function ThirdPlaceSvgLabel({
  positions,
  thirdPlaceId,
}: {
  positions: BracketLayoutResult['positions'];
  thirdPlaceId: string | undefined;
}) {
  if (!thirdPlaceId) return null;
  const pos = positions.find((p) => p.match.id === thirdPlaceId);
  if (!pos) return null;

  return (
    <text
      x={pos.x + MATCH_W / 2}
      y={pos.y - MATCH_HEADER_ABOVE}
      textAnchor="middle"
      className="fill-muted-foreground text-xs font-medium tracking-wider uppercase"
    >
      3rd Place
    </text>
  );
}

export function Bracket({
  matches,
  thirdPlaceMatch,
  athleteMap,
  matchLabel,
  readOnly,
  onSlotClick,
  onToggleLock,
  layout: layoutProp,
}: BracketProps) {
  const computed = React.useMemo(
    () => buildTwoSidedLayout(matches, thirdPlaceMatch),
    [matches, thirdPlaceMatch]
  );
  const layout = layoutProp ?? computed;
  const { positions, width, height, layoutMaxRound, thirdPlace } = layout;

  const connectors = React.useMemo(
    () => buildTwoSidedConnectors(positions, layoutMaxRound),
    [positions, layoutMaxRound]
  );

  const ctx = React.useMemo(
    () => ({
      matches,
      athleteMap,
      matchLabel,
      readOnly,
      onSlotClick,
      onToggleLock,
    }),
    [matches, athleteMap, matchLabel, readOnly, onSlotClick, onToggleLock]
  );

  if (positions.length === 0) return null;

  return (
    <BracketProvider value={ctx}>
      <div className="relative select-none" style={{ width, height }}>
        <BracketConnectors width={width} height={height} paths={connectors} />
        <svg
          width={width}
          height={height}
          className="pointer-events-none absolute inset-0 select-none"
          aria-hidden
        >
          <BracketRoundLabels
            positions={positions}
            layoutMaxRound={layoutMaxRound}
          />
          <ThirdPlaceSvgLabel
            positions={positions}
            thirdPlaceId={thirdPlace?.id}
          />
        </svg>

        {positions.map((pos) =>
          isBracketFinal(pos.match, layoutMaxRound) ? (
            <BracketFinalMatchNode key={pos.match.id} pos={pos} />
          ) : (
            <BracketMatchNode key={pos.match.id} pos={pos} />
          )
        )}
      </div>
    </BracketProvider>
  );
}
