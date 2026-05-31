import * as React from 'react';
import type { MatchData } from '@/features/dashboard/types';
import type {
  BracketConnectorPath,
  BracketLayoutResult,
} from '@/lib/tournament/bracket-layout';
import {
  buildTwoSidedConnectors,
  buildTwoSidedLayout,
} from '@/lib/tournament/bracket-layout';

export type UseBracketLayoutOptions = {
  /** Skip layout recompute when the parent already ran the hook (e.g. pan/zoom shell). */
  layout?: BracketLayoutResult;
  connectors?: Array<BracketConnectorPath>;
};

export type UseBracketLayoutResult = {
  layout: BracketLayoutResult;
  connectors: Array<BracketConnectorPath>;
};

/**
 * Memoized two-sided bracket layout + connector paths. Use this in any bracket
 * surface so a second bracket UI can share the same pipeline without copying useMemo blocks.
 */
export function useBracketLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean,
  options?: UseBracketLayoutOptions
): UseBracketLayoutResult {
  const layout = React.useMemo(
    () => options?.layout ?? buildTwoSidedLayout(matches, thirdPlaceMatch),
    [matches, thirdPlaceMatch, options?.layout]
  );

  const connectors = React.useMemo(
    () =>
      options?.connectors ??
      buildTwoSidedConnectors(layout.positions, layout.layoutMaxRound),
    [layout.positions, layout.layoutMaxRound, options?.connectors]
  );

  return { layout, connectors };
}
