import * as React from 'react';
import type { MatchData } from '@/contracts/tournament/match';
import type {
  BracketCanvasLayout,
  BracketConnectorPath,
  BracketLayoutResult,
} from '@/lib/tournament/bracket/bracket-layout';
import { canvasBuilders } from '@/lib/tournament/bracket/bracket-layout';

export type UseBracketLayoutOptions = {
  layout?: BracketLayoutResult;
  connectors?: Array<BracketConnectorPath>;
  layoutMode?: BracketCanvasLayout;
};

export type UseBracketLayoutResult = {
  layout: BracketLayoutResult;
  connectors: Array<BracketConnectorPath>;
};

/**
 * Memoized bracket layout + connector paths for two-sided or one-sided canvas.
 * Use this in any bracket surface so layout stays in sync without duplicating useMemo blocks.
 */
export function useBracketLayout(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean,
  options?: UseBracketLayoutOptions
): UseBracketLayoutResult {
  const layoutMode = options?.layoutMode ?? 'two-sided';

  const layout = React.useMemo(() => {
    if (options?.layout) return options.layout;
    return canvasBuilders[layoutMode].layout(matches, thirdPlaceMatch);
  }, [matches, thirdPlaceMatch, options?.layout, layoutMode]);

  const connectors = React.useMemo(() => {
    if (options?.connectors) return options.connectors;
    return canvasBuilders[layoutMode].connectors(
      layout.positions,
      layout.layoutMaxRound
    );
  }, [
    layout.positions,
    layout.layoutMaxRound,
    options?.connectors,
    layoutMode,
  ]);

  return { layout, connectors };
}
