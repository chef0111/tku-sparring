import type { MatchData } from '@/features/dashboard/types';

export const MATCH_W = 220;
export const MATCH_H = 70;
export const ROUND_GAP = 280;
export const PADDING = 24;
export const ATHLETE_ROW_H = MATCH_H / 2;
export const CONNECTOR_CORNER_RADIUS = 8;

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

export interface BracketConnectorPath {
  d: string;
}

/** Child → stub: horizontal, one fillet at the child-side corner, vertical to the bus (sharp at parent Y). */
export function buildConnectorChildLeg(
  childRightX: number,
  childMidY: number,
  midX: number,
  parentMidY: number,
  radius: number = CONNECTOR_CORNER_RADIUS
): string {
  const dy = Math.abs(parentMidY - childMidY);
  const dx = midX - childRightX;
  if (dy < 0.5 || dx <= 0) {
    return `M ${childRightX} ${childMidY} L ${midX} ${parentMidY}`;
  }
  const r = Math.min(
    radius,
    dx * 0.45,
    dy * 0.45,
    dx / 2 - 0.25,
    dy / 2 - 0.25
  );
  const rr = Math.max(2, r);
  const down = parentMidY > childMidY;

  if (down) {
    return [
      `M ${childRightX} ${childMidY}`,
      `L ${midX - rr} ${childMidY}`,
      `A ${rr} ${rr} 0 0 1 ${midX} ${childMidY + rr}`,
      `L ${midX} ${parentMidY}`,
    ].join(' ');
  }

  return [
    `M ${childRightX} ${childMidY}`,
    `L ${midX - rr} ${childMidY}`,
    `A ${rr} ${rr} 0 0 0 ${midX} ${childMidY - rr}`,
    `L ${midX} ${parentMidY}`,
  ].join(' ');
}

/** Shared horizontal from stub column into the parent match (draw once per parent). */
export function buildConnectorTrunk(
  midX: number,
  parentMidY: number,
  parentLeftX: number
): string {
  return `M ${midX} ${parentMidY} L ${parentLeftX} ${parentMidY}`;
}

export function buildConnectors(positions: Array<MatchPosition>) {
  const paths: Array<BracketConnectorPath> = [];
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

    let hasChild = false;
    for (const child of [childA, childB]) {
      if (!child) continue;
      hasChild = true;
      const childMidY = child.y + MATCH_H / 2;
      const childRightX = child.x + MATCH_W;
      paths.push({
        d: buildConnectorChildLeg(childRightX, childMidY, midX, parentMidY),
      });
    }
    if (hasChild) {
      paths.push({
        d: buildConnectorTrunk(midX, parentMidY, parentLeftX),
      });
    }
  }

  return paths;
}
