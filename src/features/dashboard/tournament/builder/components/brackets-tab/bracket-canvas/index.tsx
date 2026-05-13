import * as React from 'react';
import { BracketMatchNode } from './bracket-match-node';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import {
  MATCH_W,
  PADDING,
  ROUND_GAP,
  buildConnectors,
  buildLayout,
} from '@/lib/tournament/bracket-layout';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';
import { usePanZoom } from '@/features/dashboard/tournament/builder/hooks/use-pan-zoom';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  pending: 'stroke-muted-foreground/40',
  active: 'stroke-blue-500',
  complete: 'stroke-emerald-500',
};

interface BracketCanvasProps {
  matches: Array<MatchData>;
  athletes: Array<TournamentAthleteData>;
  thirdPlaceMatch: boolean;
  onSlotClick: (match: MatchData) => void;
  readOnly: boolean;
}

function ThirdPlaceLabel({
  matches,
  positions,
  thirdPlaceMatch,
}: {
  matches: Array<MatchData>;
  positions: Array<MatchPosition>;
  thirdPlaceMatch: boolean;
}) {
  if (!thirdPlaceMatch) return null;
  const maxRound = Math.max(...matches.map((m) => m.round));
  const pos = positions.find(
    (p) => p.match.round === maxRound && p.match.matchIndex === 1
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

export function BracketCanvas({
  matches,
  athletes,
  thirdPlaceMatch,
  onSlotClick,
  readOnly,
}: BracketCanvasProps) {
  const athleteMap = React.useMemo(() => {
    const map = new Map<string, TournamentAthleteData>();
    for (const a of athletes) map.set(a.id, a);
    return map;
  }, [athletes]);

  const { positions, width, height } = React.useMemo(
    () => buildLayout(matches, thirdPlaceMatch),
    [matches, thirdPlaceMatch]
  );

  const { containerRef, transform, handlers } = usePanZoom(width, height);

  const connectors = React.useMemo(
    () => buildConnectors(positions),
    [positions]
  );

  if (matches.length === 0) return null;

  const roundNums = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  return (
    <div
      ref={containerRef}
      className="canvas-background relative size-full min-h-0 overflow-hidden pl-6"
      {...handlers}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width,
          height,
          position: 'relative',
        }}
      >
        <svg
          width={width}
          height={height}
          className="absolute inset-0 select-none"
          aria-hidden
        >
          {roundNums.map((round) => {
            const maxRound = roundNums[roundNums.length - 1]!;
            const label = getBracketRoundLabel(round, maxRound);

            return (
              <text
                key={round}
                x={PADDING + round * ROUND_GAP + MATCH_W / 2}
                y={10}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-medium tracking-wider uppercase"
              >
                {label}
              </text>
            );
          })}

          {connectors.map((c, i) => (
            <path
              key={i}
              d={c.d}
              fill="none"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeMiterlimit={4}
              strokeWidth={1.5}
              className={statusColor.pending}
            />
          ))}

          <ThirdPlaceLabel
            matches={matches}
            positions={positions}
            thirdPlaceMatch={thirdPlaceMatch}
          />
        </svg>

        <div
          className={cn('relative', 'select-none')}
          style={{ width, height }}
        >
          {positions.map((pos) => (
            <BracketMatchNode
              key={pos.match.id}
              pos={pos}
              athleteMap={athleteMap}
              onSlotClick={onSlotClick}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
