import * as React from 'react';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { cn } from '@/lib/utils';

const MATCH_W = 220;
const MATCH_H = 70;
const ROUND_GAP = 280;
const PADDING = 24;
const ATHLETE_ROW_H = MATCH_H / 2;

interface BracketCanvasProps {
  matches: Array<MatchData>;
  athletes: Array<TournamentAthleteData>;
  thirdPlaceMatch: boolean;
  onMatchClick: (match: MatchData) => void;
}

interface MatchPosition {
  x: number;
  y: number;
  match: MatchData;
}

function buildLayout(matches: Array<MatchData>, thirdPlaceMatch: boolean) {
  const mainMatches = thirdPlaceMatch
    ? matches.filter((m) => {
        const maxRound = Math.max(...matches.map((mm) => mm.round));
        return !(m.round === maxRound && m.matchIndex === 1);
      })
    : matches;

  const thirdPlace = thirdPlaceMatch
    ? matches.find((m) => {
        const maxRound = Math.max(...matches.map((mm) => mm.round));
        return m.round === maxRound && m.matchIndex === 1;
      })
    : null;

  if (mainMatches.length === 0) return { positions: [], width: 0, height: 0 };

  const rounds = new Map<number, Array<MatchData>>();
  for (const m of mainMatches) {
    const arr = rounds.get(m.round) ?? [];
    arr.push(m);
    rounds.set(m.round, arr);
  }
  for (const arr of rounds.values()) {
    arr.sort((a, b) => a.matchIndex - b.matchIndex);
  }

  const roundNums = Array.from(rounds.keys()).sort((a, b) => a - b);
  const r0Count = rounds.get(roundNums[0]!)?.length ?? 1;
  const totalMainHeight = r0Count * MATCH_H + (r0Count - 1) * MATCH_H;

  const positions: Array<MatchPosition> = [];

  for (const round of roundNums) {
    const roundMatches = rounds.get(round)!;
    const count = roundMatches.length;
    const slotH = totalMainHeight / count;
    const x = PADDING + round * ROUND_GAP;

    for (let i = 0; i < count; i++) {
      const y = PADDING + i * slotH + (slotH - MATCH_H) / 2;
      positions.push({ x, y, match: roundMatches[i]! });
    }
  }

  if (thirdPlace) {
    const finalPos = positions.find(
      (p) =>
        p.match.round === roundNums[roundNums.length - 1] &&
        p.match.matchIndex === 0
    );
    const x = finalPos ? finalPos.x : PADDING + roundNums.length * ROUND_GAP;
    const y = totalMainHeight + PADDING + MATCH_H;
    positions.push({ x, y, match: thirdPlace });
  }

  const maxX = Math.max(...positions.map((p) => p.x)) + MATCH_W + PADDING;
  const maxY = Math.max(...positions.map((p) => p.y)) + MATCH_H + PADDING;

  return { positions, width: maxX, height: maxY };
}

function buildConnectors(positions: Array<MatchPosition>) {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const posMap = new Map<string, MatchPosition>();
  for (const p of positions) {
    posMap.set(`${p.match.round}-${p.match.matchIndex}`, p);
  }

  for (const pos of positions) {
    if (pos.match.round === 0) continue;
    const childA = posMap.get(
      `${pos.match.round - 1}-${pos.match.matchIndex * 2}`
    );
    const childB = posMap.get(
      `${pos.match.round - 1}-${pos.match.matchIndex * 2 + 1}`
    );

    const parentMidY = pos.y + MATCH_H / 2;
    const parentLeftX = pos.x;
    const midX = parentLeftX - (ROUND_GAP - MATCH_W) / 2;

    for (const child of [childA, childB]) {
      if (!child) continue;
      const childMidY = child.y + MATCH_H / 2;
      const childRightX = child.x + MATCH_W;
      lines.push({ x1: childRightX, y1: childMidY, x2: midX, y2: childMidY });
      lines.push({ x1: midX, y1: childMidY, x2: midX, y2: parentMidY });
    }

    lines.push({ x1: midX, y1: parentMidY, x2: parentLeftX, y2: parentMidY });
  }

  return lines;
}

const statusColor: Record<string, string> = {
  pending: 'stroke-muted-foreground/40',
  active: 'stroke-blue-500',
  complete: 'stroke-emerald-500',
};

const statusBorder: Record<string, string> = {
  pending: 'stroke-border',
  active: 'stroke-blue-500',
  complete: 'stroke-emerald-500',
};

interface MatchNodeProps {
  pos: MatchPosition;
  athleteMap: Map<string, TournamentAthleteData>;
  onClick: (match: MatchData) => void;
}

const MatchNode = React.memo(function MatchNode({
  pos,
  athleteMap,
  onClick,
}: MatchNodeProps) {
  const { match } = pos;
  const redAthlete = match.redTournamentAthleteId
    ? athleteMap.get(match.redTournamentAthleteId)
    : null;
  const blueAthlete = match.blueTournamentAthleteId
    ? athleteMap.get(match.blueTournamentAthleteId)
    : null;

  const isRedWinner =
    match.winnerId != null && match.winnerId === match.redAthleteId;
  const isBlueWinner =
    match.winnerId != null && match.winnerId === match.blueAthleteId;

  return (
    <g
      className="cursor-pointer"
      onClick={() => onClick(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(match);
      }}
    >
      <rect
        x={pos.x}
        y={pos.y}
        width={MATCH_W}
        height={MATCH_H}
        rx={6}
        className={cn('fill-card', statusBorder[match.status])}
        strokeWidth={1.5}
      />

      {/* Hover overlay */}
      <rect
        x={pos.x}
        y={pos.y}
        width={MATCH_W}
        height={MATCH_H}
        rx={6}
        className="hover:fill-primary/5 fill-transparent"
      />

      {/* Divider */}
      <line
        x1={pos.x}
        y1={pos.y + ATHLETE_ROW_H}
        x2={pos.x + MATCH_W}
        y2={pos.y + ATHLETE_ROW_H}
        className="stroke-border"
        strokeWidth={1}
      />

      {/* Winner backgrounds */}
      {isRedWinner && (
        <rect
          x={pos.x + 1}
          y={pos.y + 1}
          width={MATCH_W - 2}
          height={ATHLETE_ROW_H - 1}
          rx={5}
          className="fill-emerald-500/10"
        />
      )}
      {isBlueWinner && (
        <rect
          x={pos.x + 1}
          y={pos.y + ATHLETE_ROW_H}
          width={MATCH_W - 2}
          height={ATHLETE_ROW_H - 1}
          rx={5}
          className="fill-emerald-500/10"
        />
      )}

      {/* Red athlete row */}
      <AthleteRow
        x={pos.x}
        y={pos.y}
        athlete={redAthlete}
        locked={match.redLocked}
        wins={match.redWins}
        isWinner={isRedWinner}
        side="red"
      />

      {/* Blue athlete row */}
      <AthleteRow
        x={pos.x}
        y={pos.y + ATHLETE_ROW_H}
        athlete={blueAthlete}
        locked={match.blueLocked}
        wins={match.blueWins}
        isWinner={isBlueWinner}
        side="blue"
      />
    </g>
  );
});

interface AthleteRowProps {
  x: number;
  y: number;
  athlete: TournamentAthleteData | null | undefined;
  locked: boolean;
  wins: number;
  isWinner: boolean;
  side: 'red' | 'blue';
}

function AthleteRow({
  x,
  y,
  athlete,
  locked,
  wins,
  isWinner,
  side,
}: AthleteRowProps) {
  const textY = y + ATHLETE_ROW_H / 2;
  const sideColor = side === 'red' ? 'fill-red-500' : 'fill-blue-500';

  return (
    <>
      {/* Side indicator */}
      <rect
        x={x + 1}
        y={y + (side === 'red' ? 1 : 0)}
        width={3}
        height={ATHLETE_ROW_H - (side === 'red' ? 2 : 1)}
        className={sideColor}
        rx={side === 'red' ? 1 : 0}
      />

      {locked && (
        <g transform={`translate(${x + 10}, ${textY - 5})`}>
          <rect
            x={1}
            y={4}
            width={8}
            height={6}
            rx={1}
            className="fill-none stroke-amber-500"
            strokeWidth={1.2}
          />
          <path
            d="M3,4 V2.5 A2,2 0 0,1 7,2.5 V4"
            className="fill-none stroke-amber-500"
            strokeWidth={1.2}
          />
        </g>
      )}

      {athlete?.seed != null && (
        <text
          x={x + (locked ? 24 : 10)}
          y={textY}
          dominantBaseline="central"
          className="fill-muted-foreground text-[10px]"
        >
          {athlete.seed}
        </text>
      )}

      <text
        x={x + (locked ? 36 : athlete?.seed != null ? 24 : 10)}
        y={textY}
        dominantBaseline="central"
        className={cn(
          'text-[12px]',
          athlete ? 'fill-foreground' : 'fill-muted-foreground italic',
          isWinner && 'fill-emerald-600 font-semibold'
        )}
      >
        {athlete ? truncate(athlete.name, 16) : 'BYE'}
      </text>

      {/* Score */}
      <text
        x={x + MATCH_W - 10}
        y={textY}
        dominantBaseline="central"
        textAnchor="end"
        className={cn(
          'font-mono text-[12px]',
          isWinner ? 'fill-emerald-600 font-semibold' : 'fill-muted-foreground'
        )}
      >
        {wins}
      </text>
    </>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
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
      className="fill-muted-foreground text-[11px] font-medium tracking-wider uppercase"
    >
      3rd Place
    </text>
  );
}

export function BracketCanvas({
  matches,
  athletes,
  thirdPlaceMatch,
  onMatchClick,
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

  const connectors = React.useMemo(
    () => buildConnectors(positions),
    [positions]
  );

  if (matches.length === 0) return null;

  const roundNums = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );

  return (
    <div className="h-full w-full overflow-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="select-none"
      >
        {/* Round labels */}
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
              y={12}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px] font-medium tracking-wider uppercase"
            >
              {label}
            </text>
          );
        })}

        {/* Connectors */}
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

        {/* Match nodes */}
        {positions.map((pos) => (
          <MatchNode
            key={pos.match.id}
            pos={pos}
            athleteMap={athleteMap}
            onClick={onMatchClick}
          />
        ))}

        {/* Third place label */}
        <ThirdPlaceLabel
          matches={matches}
          positions={positions}
          thirdPlaceMatch={thirdPlaceMatch}
        />
      </svg>
    </div>
  );
}
