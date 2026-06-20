import type { MatchData, MatchStatus } from '@/contracts/tournament/match';

export type BracketCanvasLayout = 'two-sided' | 'one-sided';

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

export interface BracketConnectorPath {
  d: string;
  status: MatchStatus;
}

export type RoundLabelPlacement = {
  key: string;
  x: number;
  label: string;
};
