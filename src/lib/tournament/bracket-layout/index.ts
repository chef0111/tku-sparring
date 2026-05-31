import { buildOneSidedConnectors, buildTwoSidedConnectors } from './connectors';
import { layoutCenterX, matchX, oneSidedMatchX } from './coords';
import type { MatchData } from '@/features/dashboard/types';
import type {
  BracketCanvasLayout,
  BracketConnectorPath,
  BracketLayoutResult,
  BracketWing,
  MatchPosition,
} from './types';
import {
  MATCH_H,
  MATCH_ROW_GAP,
  MATCH_ROW_GAP_COMPACT,
  MATCH_ROW_GAP_SPACIOUS,
  MATCH_W,
  PADDING,
  ROUND_LABEL_BAND,
} from '@/config/bracket';

export { layoutCenterX } from './coords';

export * from './types';
export * from './connectors';
export * from './labels';

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

/** Two-sided wing vertical gap: tighter when bracket has more than three rounds. */
export function twoSidedMatchRowGap(layoutMaxRound: number): number {
  return layoutMaxRound > 2 ? MATCH_ROW_GAP_SPACIOUS : MATCH_ROW_GAP_COMPACT;
}

type RoundsMap = Map<number, Array<MatchData>>;

function emptyLayoutResult(
  layoutMaxRound: number,
  thirdPlace: MatchData | null
): BracketLayoutResult {
  return {
    positions: [],
    width: 0,
    height: 0,
    layoutMaxRound,
    thirdPlace,
  };
}

function groupMainMatchesByRound(mainMatches: Array<MatchData>): {
  rounds: RoundsMap;
  roundNums: Array<number>;
} {
  const rounds: RoundsMap = new Map();
  for (const m of mainMatches) {
    const arr = rounds.get(m.round) ?? [];
    arr.push(m);
    rounds.set(m.round, arr);
  }
  for (const arr of rounds.values()) {
    arr.sort((a, b) => a.matchIndex - b.matchIndex);
  }
  return { rounds, roundNums: Array.from(rounds.keys()).sort((a, b) => a - b) };
}

function layoutBounds(positions: Array<MatchPosition>): {
  width: number;
  height: number;
} {
  return {
    width: Math.max(...positions.map((p) => p.x)) + MATCH_W + PADDING,
    height: Math.max(...positions.map((p) => p.y)) + MATCH_H + PADDING,
  };
}

function layoutYTreeFromR0({
  rounds,
  roundNums,
  matchTop,
  rowGap,
  r0Matches,
  propagateThroughRound,
  matchInRound,
}: {
  rounds: RoundsMap;
  roundNums: Array<number>;
  matchTop: number;
  rowGap: number;
  r0Matches: Array<MatchData>;
  propagateThroughRound: number;
  matchInRound?: (match: MatchData) => boolean;
}): { yByKey: Map<string, number>; treeHeight: number } {
  const yByKey = new Map<string, number>();
  const r0Count = r0Matches.length;
  if (r0Count === 0) return { yByKey, treeHeight: 0 };

  const treeHeight = r0Count * MATCH_H + (r0Count - 1) * rowGap;
  const slotH = treeHeight / r0Count;

  for (let i = 0; i < r0Matches.length; i++) {
    const match = r0Matches[i]!;
    yByKey.set(
      `${match.round}-${match.matchIndex}`,
      matchTop + i * slotH + (slotH - MATCH_H) / 2
    );
  }

  for (const round of roundNums.slice(1)) {
    if (round > propagateThroughRound) continue;
    for (const match of rounds.get(round) ?? []) {
      if (matchInRound && !matchInRound(match)) continue;
      const childA = yByKey.get(`${round - 1}-${match.matchIndex * 2}`);
      const childB = yByKey.get(`${round - 1}-${match.matchIndex * 2 + 1}`);
      const midA =
        childA != null ? childA + MATCH_H / 2 : matchTop + treeHeight / 2;
      const midB =
        childB != null ? childB + MATCH_H / 2 : matchTop + treeHeight / 2;
      yByKey.set(
        `${match.round}-${match.matchIndex}`,
        (midA + midB) / 2 - MATCH_H / 2
      );
    }
  }

  return { yByKey, treeHeight };
}

function appendThirdPlacePosition(
  positions: Array<MatchPosition>,
  thirdPlace: MatchData,
  {
    matchTop,
    totalMainHeight,
    x,
  }: {
    matchTop: number;
    totalMainHeight: number;
    x: number;
  }
) {
  positions.push({
    x,
    y: matchTop + totalMainHeight + PADDING + MATCH_H,
    match: thirdPlace,
    wing: 'center',
  });
}

export function buildTwoSidedLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
): BracketLayoutResult {
  const { mainMatches, thirdPlace, layoutMaxRound } = resolveBracketLayout(
    matches,
    thirdPlaceMatch
  );
  const maxRound = layoutMaxRound;

  if (mainMatches.length === 0) {
    return emptyLayoutResult(layoutMaxRound, thirdPlace);
  }

  const { rounds, roundNums } = groupMainMatchesByRound(mainMatches);
  const r0Count = rounds.get(roundNums[0]!)?.length ?? 1;
  const rowGap = twoSidedMatchRowGap(maxRound);
  const totalMainHeight = r0Count * MATCH_H + (r0Count - 1) * rowGap;
  const matchTop = PADDING + ROUND_LABEL_BAND;
  const centerX = layoutCenterX(maxRound);
  const yByKey = new Map<string, number>();

  for (const wing of ['left', 'right'] as const) {
    const r0InWing = (rounds.get(0) ?? []).filter(
      (m) => matchWing(0, m.matchIndex, maxRound) === wing
    );
    const { yByKey: wingY } = layoutYTreeFromR0({
      rounds,
      roundNums,
      matchTop,
      rowGap,
      r0Matches: r0InWing,
      propagateThroughRound: maxRound - 1,
      matchInRound: (m) => matchWing(m.round, m.matchIndex, maxRound) === wing,
    });
    for (const [key, y] of wingY) yByKey.set(key, y);
  }

  const leftSf = yByKey.get(`${maxRound - 1}-0`);
  const rightSf = yByKey.get(`${maxRound - 1}-1`);
  yByKey.set(
    `${maxRound}-0`,
    leftSf != null && rightSf != null
      ? (leftSf + rightSf) / 2
      : matchTop + totalMainHeight / 2 - MATCH_H / 2
  );

  const positions: Array<MatchPosition> = [];
  for (const round of roundNums) {
    for (const match of rounds.get(round)!) {
      const wing = matchWing(match.round, match.matchIndex, maxRound);
      positions.push({
        x: matchX(match.round, wing, maxRound, centerX),
        y: yByKey.get(`${match.round}-${match.matchIndex}`)!,
        match,
        wing,
      });
    }
  }

  if (thirdPlace) {
    const finalPos = positions.find(
      (p) => p.match.round === maxRound && p.match.matchIndex === 0
    );
    appendThirdPlacePosition(positions, thirdPlace, {
      matchTop,
      totalMainHeight,
      x: finalPos?.x ?? centerX - MATCH_W / 2,
    });
  }

  return {
    positions,
    ...layoutBounds(positions),
    layoutMaxRound,
    thirdPlace,
  };
}

export function buildOneSidedLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
): BracketLayoutResult {
  const { mainMatches, thirdPlace, layoutMaxRound } = resolveBracketLayout(
    matches,
    thirdPlaceMatch
  );
  const maxRound = layoutMaxRound;

  if (mainMatches.length === 0) {
    return emptyLayoutResult(layoutMaxRound, thirdPlace);
  }

  const { rounds, roundNums } = groupMainMatchesByRound(mainMatches);
  const r0Matches = rounds.get(roundNums[0]!) ?? [];
  const matchTop = PADDING + ROUND_LABEL_BAND;

  const { yByKey, treeHeight: totalMainHeight } = layoutYTreeFromR0({
    rounds,
    roundNums,
    matchTop,
    rowGap: MATCH_ROW_GAP,
    r0Matches,
    propagateThroughRound: maxRound,
  });

  const positions: Array<MatchPosition> = [];
  for (const round of roundNums) {
    for (const match of rounds.get(round)!) {
      positions.push({
        x: oneSidedMatchX(match.round, maxRound),
        y: yByKey.get(`${match.round}-${match.matchIndex}`)!,
        match,
        wing: 'left',
      });
    }
  }

  if (thirdPlace) {
    const finalPos = positions.find(
      (p) => p.match.round === maxRound && p.match.matchIndex === 0
    );
    appendThirdPlacePosition(positions, thirdPlace, {
      matchTop,
      totalMainHeight,
      x: finalPos?.x ?? oneSidedMatchX(maxRound, maxRound),
    });
  }

  return {
    positions,
    ...layoutBounds(positions),
    layoutMaxRound,
    thirdPlace,
  };
}

export const canvasBuilders = {
  'two-sided': {
    layout: buildTwoSidedLayout,
    connectors: buildTwoSidedConnectors,
  },
  'one-sided': {
    layout: buildOneSidedLayout,
    connectors: buildOneSidedConnectors,
  },
} as const satisfies Record<
  BracketCanvasLayout,
  {
    layout: (
      matches: Array<MatchData>,
      thirdPlaceMatch: boolean
    ) => BracketLayoutResult;
    connectors: (
      positions: Array<MatchPosition>,
      layoutMaxRound: number
    ) => Array<BracketConnectorPath>;
  }
>;
