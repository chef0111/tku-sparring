import type {
  BracketCanvasLayout,
  MatchPosition,
} from '@/lib/tournament/bracket/bracket-layout';
import { roundLabelPlacements } from '@/lib/tournament/bracket/bracket-layout';
import { ROUND_LABEL_Y } from '@/config/bracket';

export interface BracketRoundLabelsProps {
  positions: Array<MatchPosition>;
  layoutMaxRound: number;
  layoutMode?: BracketCanvasLayout;
}

const labelClassName =
  'fill-muted-foreground text-sm font-semibold tracking-wider uppercase';

export function BracketRoundLabels({
  positions,
  layoutMaxRound,
  layoutMode = 'two-sided',
}: BracketRoundLabelsProps) {
  const placements = roundLabelPlacements(
    positions,
    layoutMaxRound,
    layoutMode
  );

  return placements.map(({ key, x, label }) => (
    <text
      key={key}
      x={x}
      y={ROUND_LABEL_Y}
      textAnchor="middle"
      className={labelClassName}
    >
      {label}
    </text>
  ));
}
