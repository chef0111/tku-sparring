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
      className="relative size-full min-h-0 overflow-hidden"
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
            let label: string;
            if (round === maxRound) label = 'Final';
            else if (round === maxRound - 1) label = 'Semifinal';
            else label = `Round ${round + 1}`;

            return (
              <text
                key={round}
                x={PADDING + round * ROUND_GAP + MATCH_W / 2}
                y={8}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-medium tracking-wider uppercase"
              >
                {label}
              </text>
            );
          })}

          {connectors.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={statusColor.pending}
              strokeWidth={1.5}
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
