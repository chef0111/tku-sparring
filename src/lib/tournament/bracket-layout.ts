import type { MatchData, MatchStatus } from '@/features/dashboard/types';

export const MATCH_W = 220;
export const MATCH_H = 70;
export const ROUND_GAP = 280;
export const PADDING = 24;
/** Reserved SVG band above matches for round titles (keeps match headers clear). */
export const ROUND_LABEL_BAND = 44;
export const ROUND_LABEL_Y = 13;
/** Gap between match box top edge and the "Match N" header line. */
export const MATCH_HEADER_ABOVE = 16;
export const ATHLETE_ROW_H = MATCH_H / 2;
export const CONNECTOR_CORNER_RADIUS = 8;

export type BracketWing = 'left' | 'right' | 'center';

export interface MatchPosition {
  x: number;
  y: number;
  match: MatchData;
  wing: BracketWing;
}

export type BracketLayoutResult = {
  positions: Array<MatchPosition>;
  width: number;
  height: number;
  layoutMaxRound: number;
  thirdPlace: MatchData | null;
};

export function matchWing(
  round: number,
  matchIndex: number,
  maxRound: number
): BracketWing {
  if (round === maxRound && matchIndex <= 1) return 'center';
  const split = 2 ** (maxRound - 1 - round);
  return matchIndex < split ? 'left' : 'right';
}

export function resolveBracketLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
): {
  mainMatches: Array<MatchData>;
  thirdPlace: MatchData | null;
  layoutMaxRound: number;
} {
  if (matches.length === 0) {
    return { mainMatches: [], thirdPlace: null, layoutMaxRound: 0 };
  }
  const dataMaxRound = Math.max(...matches.map((m) => m.round));

  if (!thirdPlaceMatch) {
    return {
      mainMatches: matches,
      thirdPlace: null,
      layoutMaxRound: dataMaxRound,
    };
  }

  const sameRoundThird = matches.find(
    (m) => m.round === dataMaxRound && m.matchIndex === 1
  );
  if (sameRoundThird) {
    return {
      mainMatches: matches.filter(
        (m) => !(m.round === dataMaxRound && m.matchIndex === 1)
      ),
      thirdPlace: sameRoundThird,
      layoutMaxRound: dataMaxRound,
    };
  }

  const extraRoundThird = matches.find(
    (m) => m.round === dataMaxRound && m.matchIndex === 0
  );
  if (
    extraRoundThird &&
    !matches.some((m) => m.round === dataMaxRound && m.matchIndex === 1)
  ) {
    return {
      mainMatches: matches.filter((m) => m.round !== dataMaxRound),
      thirdPlace: extraRoundThird,
      layoutMaxRound: dataMaxRound - 1,
    };
  }

  return {
    mainMatches: matches,
    thirdPlace: null,
    layoutMaxRound: dataMaxRound,
  };
}

export function isBracketFinal(
  match: MatchData,
  layoutMaxRound: number
): boolean {
  return match.round === layoutMaxRound && match.matchIndex === 0;
}

export function layoutCenterX(maxRound: number): number {
  return PADDING + maxRound * ROUND_GAP + MATCH_W / 2;
}

export function roundLabelCenterX(
  round: number,
  wing: BracketWing,
  layoutMaxRound: number
): number {
  const centerX = layoutCenterX(layoutMaxRound);
  const offset = (layoutMaxRound - round) * ROUND_GAP;
  if (wing === 'center') return centerX;
  if (wing === 'left') return centerX - offset;
  return centerX + offset;
}

function matchX(
  round: number,
  matchIndex: number,
  maxRound: number,
  centerX: number
): number {
  const wing = matchWing(round, matchIndex, maxRound);
  const offset = (maxRound - round) * ROUND_GAP;
  if (wing === 'center') return centerX - MATCH_W / 2;
  if (wing === 'left') return centerX - MATCH_W / 2 - offset;
  return centerX + MATCH_W / 2 + offset - MATCH_W;
}

export function buildTwoSidedLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
) {
  const { mainMatches, thirdPlace, layoutMaxRound } = resolveBracketLayout(
    matches,
    thirdPlaceMatch
  );
  const maxRound = layoutMaxRound;

  if (mainMatches.length === 0) {
    return {
      positions: [],
      width: 0,
      height: 0,
      layoutMaxRound,
      thirdPlace,
    };
  }

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

  const centerX = layoutCenterX(maxRound);
  const matchTop = PADDING + ROUND_LABEL_BAND;
  const yByKey = new Map<string, number>();

  function layoutWingTree(wing: 'left' | 'right') {
    const r0InWing = (rounds.get(0) ?? []).filter(
      (m) => matchWing(0, m.matchIndex, maxRound) === wing
    );
    if (r0InWing.length === 0) return;

    const wingHeight =
      r0InWing.length * MATCH_H + (r0InWing.length - 1) * MATCH_H;
    const slotH = wingHeight / r0InWing.length;

    for (let i = 0; i < r0InWing.length; i++) {
      const match = r0InWing[i]!;
      yByKey.set(
        `${match.round}-${match.matchIndex}`,
        matchTop + i * slotH + (slotH - MATCH_H) / 2
      );
    }

    for (const round of roundNums.slice(1)) {
      if (round === maxRound) continue;
      for (const match of rounds.get(round) ?? []) {
        if (matchWing(match.round, match.matchIndex, maxRound) !== wing) {
          continue;
        }
        const childA = yByKey.get(`${round - 1}-${match.matchIndex * 2}`);
        const childB = yByKey.get(`${round - 1}-${match.matchIndex * 2 + 1}`);
        const midA =
          childA != null ? childA + MATCH_H / 2 : matchTop + wingHeight / 2;
        const midB =
          childB != null ? childB + MATCH_H / 2 : matchTop + wingHeight / 2;
        yByKey.set(
          `${match.round}-${match.matchIndex}`,
          (midA + midB) / 2 - MATCH_H / 2
        );
      }
    }
  }

  layoutWingTree('left');
  layoutWingTree('right');

  const leftSf = yByKey.get(`${maxRound - 1}-0`);
  const rightSf = yByKey.get(`${maxRound - 1}-1`);
  const finalY =
    leftSf != null && rightSf != null
      ? (leftSf + rightSf) / 2
      : matchTop + totalMainHeight / 2 - MATCH_H / 2;
  yByKey.set(`${maxRound}-0`, finalY);

  const positions: Array<MatchPosition> = [];
  for (const round of roundNums) {
    for (const match of rounds.get(round)!) {
      const y = yByKey.get(`${match.round}-${match.matchIndex}`)!;
      positions.push({
        x: matchX(match.round, match.matchIndex, maxRound, centerX),
        y,
        match,
        wing: matchWing(match.round, match.matchIndex, maxRound),
      });
    }
  }

  if (thirdPlace) {
    const finalPos = positions.find(
      (p) => p.match.round === maxRound && p.match.matchIndex === 0
    );
    const x = finalPos?.x ?? centerX - MATCH_W / 2;
    const y = matchTop + totalMainHeight + PADDING + MATCH_H;
    positions.push({
      x,
      y,
      match: thirdPlace,
      wing: 'center',
    });
  }

  const maxX = Math.max(...positions.map((p) => p.x)) + MATCH_W + PADDING;
  const maxY = Math.max(...positions.map((p) => p.y)) + MATCH_H + PADDING;

  return {
    positions,
    width: maxX,
    height: maxY,
    layoutMaxRound,
    thirdPlace,
  };
}

/** @deprecated Use buildTwoSidedLayout */
export function buildLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
) {
  return buildTwoSidedLayout(matches, thirdPlaceMatch);
}

export interface BracketConnectorPath {
  d: string;
  status: MatchStatus;
}

/** Child → stub (LTR wing): horizontal from child right, fillet, vertical to bus. */
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

/** Child → stub (RTL wing): horizontal from child left, fillet, vertical to bus. */
export function buildConnectorChildLegRtl(
  childLeftX: number,
  childMidY: number,
  midX: number,
  parentMidY: number,
  radius: number = CONNECTOR_CORNER_RADIUS
): string {
  const dy = Math.abs(parentMidY - childMidY);
  const dx = childLeftX - midX;
  if (dy < 0.5 || dx <= 0) {
    return `M ${childLeftX} ${childMidY} L ${midX} ${parentMidY}`;
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
      `M ${childLeftX} ${childMidY}`,
      `L ${midX + rr} ${childMidY}`,
      `A ${rr} ${rr} 0 0 0 ${midX} ${childMidY + rr}`,
      `L ${midX} ${parentMidY}`,
    ].join(' ');
  }

  return [
    `M ${childLeftX} ${childMidY}`,
    `L ${midX + rr} ${childMidY}`,
    `A ${rr} ${rr} 0 0 1 ${midX} ${childMidY - rr}`,
    `L ${midX} ${parentMidY}`,
  ].join(' ');
}

/** Shared horizontal from stub column into the parent match (LTR). */
export function buildConnectorTrunk(
  midX: number,
  parentMidY: number,
  parentLeftX: number
): string {
  return `M ${midX} ${parentMidY} L ${parentLeftX} ${parentMidY}`;
}

/** Shared horizontal from stub column into the parent match (RTL). */
export function buildConnectorTrunkRtl(
  midX: number,
  parentMidY: number,
  parentRightX: number
): string {
  return `M ${midX} ${parentMidY} L ${parentRightX} ${parentMidY}`;
}

const connectorStub = (ROUND_GAP - MATCH_W) / 2;

type ConnectorDirection = 'ltr' | 'rtl';

function pushConnector(
  paths: Array<BracketConnectorPath>,
  d: string,
  status: MatchStatus
) {
  paths.push({ d, status });
}

function appendToParent(
  paths: Array<BracketConnectorPath>,
  parent: MatchPosition,
  direction: ConnectorDirection,
  children: Array<MatchPosition | undefined>
) {
  const parentMidY = parent.y + MATCH_H / 2;
  const status = parent.match.status;

  if (direction === 'ltr') {
    const parentLeftX = parent.x;
    const midX = parentLeftX - connectorStub;
    let hasChild = false;
    for (const child of children) {
      if (!child) continue;
      hasChild = true;
      pushConnector(
        paths,
        buildConnectorChildLeg(
          child.x + MATCH_W,
          child.y + MATCH_H / 2,
          midX,
          parentMidY
        ),
        status
      );
    }
    if (hasChild) {
      pushConnector(
        paths,
        buildConnectorTrunk(midX, parentMidY, parentLeftX),
        status
      );
    }
    return;
  }

  const parentRightX = parent.x + MATCH_W;
  const midX = parentRightX + connectorStub;
  let hasChild = false;
  for (const child of children) {
    if (!child) continue;
    hasChild = true;
    pushConnector(
      paths,
      buildConnectorChildLegRtl(
        child.x,
        child.y + MATCH_H / 2,
        midX,
        parentMidY
      ),
      status
    );
  }
  if (hasChild) {
    pushConnector(
      paths,
      buildConnectorTrunkRtl(midX, parentMidY, parentRightX),
      status
    );
  }
}

export function buildTwoSidedConnectors(
  positions: Array<MatchPosition>,
  layoutMaxRound: number
) {
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

    if (isBracketFinal(pos.match, layoutMaxRound)) {
      appendToParent(paths, pos, 'ltr', [childA]);
      appendToParent(paths, pos, 'rtl', [childB]);
      continue;
    }

    if (pos.wing === 'left') {
      appendToParent(paths, pos, 'ltr', [childA, childB]);
      continue;
    }

    if (pos.wing === 'right') {
      appendToParent(paths, pos, 'rtl', [childA, childB]);
    }
  }

  return paths;
}

/** @deprecated Use buildTwoSidedConnectors */
export function buildConnectors(
  positions: Array<MatchPosition>,
  layoutMaxRound: number = Math.max(0, ...positions.map((p) => p.match.round))
) {
  return buildTwoSidedConnectors(positions, layoutMaxRound);
}
