import type { BracketWing } from './types';
import {
  FINALE_LTR_COLUMN_EXTRA,
  FINAL_FEEDER_EXTRA,
  MATCH_W,
  PADDING,
  ROUND_GAP,
} from '@/config/bracket';

export function layoutCenterX(maxRound: number): number {
  return PADDING + maxRound * ROUND_GAP + MATCH_W / 2;
}

function roundColumnOffset(
  round: number,
  wing: BracketWing,
  layoutMaxRound: number
): number {
  let offset = (layoutMaxRound - round) * ROUND_GAP;
  if (wing !== 'center' && round < layoutMaxRound) {
    offset += FINAL_FEEDER_EXTRA;
  }
  return offset;
}

export function matchX(
  round: number,
  wing: BracketWing,
  layoutMaxRound: number,
  centerX: number
): number {
  const offset = roundColumnOffset(round, wing, layoutMaxRound);
  if (wing === 'center') return centerX - MATCH_W / 2;
  if (wing === 'left') return centerX - MATCH_W / 2 - offset;
  return centerX + MATCH_W / 2 + offset - MATCH_W;
}

export function oneSidedMatchX(round: number, layoutMaxRound: number): number {
  let x = PADDING + round * ROUND_GAP;
  if (round === layoutMaxRound && layoutMaxRound > 0) {
    x += FINALE_LTR_COLUMN_EXTRA;
  }
  return x;
}

export function roundLabelCenterX(
  round: number,
  wing: BracketWing,
  layoutMaxRound: number
): number {
  const centerX = layoutCenterX(layoutMaxRound);
  const offset = roundColumnOffset(round, wing, layoutMaxRound);
  if (wing === 'center') return centerX;
  if (wing === 'left') return centerX - offset;
  return centerX + offset;
}

export function oneSidedRoundLabelX(
  round: number,
  layoutMaxRound: number
): number {
  return oneSidedMatchX(round, layoutMaxRound) + MATCH_W / 2;
}
