import {
  AlignHorizontalJustifyStart,
  SquareSplitHorizontal,
} from 'lucide-react';

export const MATCH_W = 220;
export const MATCH_H = 70;
/** Horizontal step between round columns (smaller = tighter bracket + shorter connector stubs). */
export const ROUND_GAP = 248;
/** Default vertical gap between first-round matches (two-sided uses dynamic gap). */
export const MATCH_ROW_GAP = 48;
/** Two-sided wing row gap when bracket has ≤3 rounds (≤8 athletes). */
export const MATCH_ROW_GAP_COMPACT = 80;
/** Two-sided wing row gap when bracket has >3 rounds (>8 athletes). */
export const MATCH_ROW_GAP_SPACIOUS = 40;
/** Extra space between semifinal column and final (longer feeder connectors). */
export const FINAL_FEEDER_EXTRA = 20;
/** One-sided final column inset — room for a visible horizontal feeder trunk. */
export const FINALE_LTR_COLUMN_EXTRA = 48;
export const PADDING = 24;
/** Reserved SVG band above matches for round titles (keeps match headers clear). */
export const ROUND_LABEL_BAND = 44;
export const ROUND_LABEL_Y = 13;
/** Gap between match box top edge and the "Match N" header line. */
export const MATCH_HEADER_ABOVE = 16;
export const ATHLETE_ROW_H = MATCH_H / 2;
/** Fillet on connector elbows; capped smaller when ROUND_GAP is tight. */
export const CONNECTOR_CORNER_RADIUS = 6;

export const bracketConfig = [
  {
    value: 'two-sided',
    label: 'Two-sided layout',
    icon: SquareSplitHorizontal,
    description:
      'Default layout, suitable for brackets with more than 3 rounds.',
  },
  {
    value: 'one-sided',
    label: 'One-sided layout',
    icon: AlignHorizontalJustifyStart,
    description:
      'Alternative layout, suitable for brackets with 3 rounds or less.',
  },
];
