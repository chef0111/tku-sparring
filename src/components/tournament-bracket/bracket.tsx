import * as React from 'react';
import { BracketConnectors } from './bracket-connectors';
import { BracketFinalMatchNode } from './bracket-final-match-node';
import { BracketMatchNode } from './bracket-match-node';
import { BracketRoundLabels } from './bracket-round-labels';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import {
  MATCH_W,
  buildTwoSidedConnectors,
  buildTwoSidedLayout,
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
}

function layoutMaxRound(matches: Array<MatchData>, thirdPlaceMatch: boolean) {
  if (matches.length === 0) return 0;
  const dataMaxRound = Math.max(...matches.map((m) => m.round));
  if (!thirdPlaceMatch) return dataMaxRound;
  const sameRoundThird = matches.some(
    (m) => m.round === dataMaxRound && m.matchIndex === 1
  );
  if (sameRoundThird) return dataMaxRound;
  const extraRoundThird = matches.some(
    (m) =>
      m.round === dataMaxRound &&
      m.matchIndex === 0 &&
      !matches.some((x) => x.round === dataMaxRound && x.matchIndex === 1)
  );
  if (extraRoundThird) return dataMaxRound - 1;
  return dataMaxRound;
}

function isFinalNode(
  pos: { match: MatchData; wing: string },
  maxRound: number
) {
  return (
    pos.wing === 'center' &&
    pos.match.matchIndex === 0 &&
    pos.match.round === maxRound
  );
}

function ThirdPlaceSvgLabel({
  positions,
  thirdPlaceMatch,
}: {
  positions: ReturnType<typeof buildTwoSidedLayout>['positions'];
  thirdPlaceMatch: boolean;
}) {
  if (!thirdPlaceMatch) return null;
  const pos = positions.find(
    (p) => p.wing === 'center' && p.match.matchIndex !== 0
  );
  if (!pos) return null;

  return (
    <text
      x={pos.x + MATCH_W / 2}
      y={pos.y - 8}
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
}: BracketProps) {
  const { positions, width, height } = React.useMemo(
    () => buildTwoSidedLayout(matches, thirdPlaceMatch),
    [matches, thirdPlaceMatch]
  );

  const connectors = React.useMemo(
    () => buildTwoSidedConnectors(positions),
    [positions]
  );

  const maxRound = layoutMaxRound(matches, thirdPlaceMatch);

  if (positions.length === 0) return null;

  return (
    <div className="relative select-none" style={{ width, height }}>
      <BracketConnectors width={width} height={height} paths={connectors} />
      <svg
        width={width}
        height={height}
        className="pointer-events-none absolute inset-0 select-none"
        aria-hidden
      >
        <BracketRoundLabels positions={positions} matches={matches} />
        <ThirdPlaceSvgLabel
          positions={positions}
          thirdPlaceMatch={thirdPlaceMatch}
        />
      </svg>

      {positions.map((pos) =>
        isFinalNode(pos, maxRound) ? (
          <BracketFinalMatchNode
            key={pos.match.id}
            pos={pos}
            matches={matches}
            athleteMap={athleteMap}
            matchLabel={matchLabel}
            readOnly={readOnly}
            onSlotClick={onSlotClick}
            onToggleLock={onToggleLock}
          />
        ) : (
          <BracketMatchNode
            key={pos.match.id}
            pos={pos}
            matches={matches}
            athleteMap={athleteMap}
            matchLabel={matchLabel}
            readOnly={readOnly}
            onSlotClick={onSlotClick}
            onToggleLock={onToggleLock}
          />
        )
      )}
    </div>
  );
}
