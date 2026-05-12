import type { MatchData } from '@/features/dashboard/types';

export const MATCH_W = 220;
export const MATCH_H = 70;
export const ROUND_GAP = 280;
export const PADDING = 24;
export const ATHLETE_ROW_H = MATCH_H / 2;

export interface MatchPosition {
  x: number;
  y: number;
  match: MatchData;
}

export function buildLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
) {
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

export function buildConnectors(positions: Array<MatchPosition>) {
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
