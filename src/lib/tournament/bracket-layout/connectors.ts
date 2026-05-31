import type { MatchStatus } from '@/features/dashboard/types';
import type {
  BracketCanvasLayout,
  BracketConnectorPath,
  MatchPosition,
} from './types';
import {
  CONNECTOR_CORNER_RADIUS,
  FINALE_LTR_COLUMN_EXTRA,
  MATCH_H,
  MATCH_W,
  ROUND_GAP,
} from '@/config/bracket';

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

/** Layout left edge sits inside the scaled final box (`scale-120`, center origin). */
const FINAL_SCALE_OVERHANG = (MATCH_W * (1.2 - 1)) / 2;

type ConnectorDirection = 'ltr' | 'rtl';

function isBracketFinal(
  match: MatchPosition['match'],
  layoutMaxRound: number
): boolean {
  return match.round === layoutMaxRound && match.matchIndex === 0;
}

function pushConnector(
  paths: Array<BracketConnectorPath>,
  d: string,
  status: MatchStatus
) {
  paths.push({ d, status });
}

function appendLtrToParent(
  paths: Array<BracketConnectorPath>,
  parent: MatchPosition,
  children: Array<MatchPosition | undefined>,
  trunkEndX?: number
) {
  const parentMidY = parent.y + MATCH_H / 2;
  const status = parent.match.status;
  const parentLeftX = parent.x;
  const midX = parentLeftX - connectorStub;
  const trunkX = trunkEndX ?? parentLeftX;
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
    pushConnector(paths, buildConnectorTrunk(midX, parentMidY, trunkX), status);
  }
}

function appendOneSidedFinalFeeders(
  paths: Array<BracketConnectorPath>,
  parent: MatchPosition,
  childA: MatchPosition | undefined,
  childB: MatchPosition | undefined
) {
  const feeders = [childA, childB].filter((c): c is MatchPosition => c != null);
  if (feeders.length === 0) return;

  const parentMidY = parent.y + MATCH_H / 2;
  const status = parent.match.status;
  const attachX = parent.x - FINAL_SCALE_OVERHANG;
  const maxChildRight = Math.max(...feeders.map((c) => c.x + MATCH_W));
  const minTrunk = FINALE_LTR_COLUMN_EXTRA - FINAL_SCALE_OVERHANG;
  const busX = Math.max(maxChildRight + connectorStub, attachX - minTrunk);

  for (const child of feeders) {
    pushConnector(
      paths,
      buildConnectorChildLeg(
        child.x + MATCH_W,
        child.y + MATCH_H / 2,
        busX,
        parentMidY
      ),
      status
    );
  }
  pushConnector(paths, buildConnectorTrunk(busX, parentMidY, attachX), status);
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
    appendLtrToParent(paths, parent, children);
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

function buildConnectors(
  positions: Array<MatchPosition>,
  layoutMaxRound: number,
  layoutMode: BracketCanvasLayout
): Array<BracketConnectorPath> {
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

    if (layoutMode === 'one-sided') {
      if (isBracketFinal(pos.match, layoutMaxRound)) {
        appendOneSidedFinalFeeders(paths, pos, childA, childB);
      } else {
        appendLtrToParent(paths, pos, [childA, childB]);
      }
      continue;
    }

    if (isBracketFinal(pos.match, layoutMaxRound)) {
      appendToParent(paths, pos, 'ltr', [childA]);
      appendToParent(paths, pos, 'rtl', [childB]);
      continue;
    }

    if (pos.wing === 'left') {
      appendToParent(paths, pos, 'ltr', [childA, childB]);
    } else if (pos.wing === 'right') {
      appendToParent(paths, pos, 'rtl', [childA, childB]);
    }
  }

  return paths;
}

export function buildTwoSidedConnectors(
  positions: Array<MatchPosition>,
  layoutMaxRound: number
) {
  return buildConnectors(positions, layoutMaxRound, 'two-sided');
}

export function buildOneSidedConnectors(
  positions: Array<MatchPosition>,
  layoutMaxRound: number
) {
  return buildConnectors(positions, layoutMaxRound, 'one-sided');
}
