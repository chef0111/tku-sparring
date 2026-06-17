import { BracketMatchNodeFrame } from './bracket-match-node-frame';
import type { MatchPosition } from '@/lib/tournament/bracket/bracket-layout';
import { useBracket } from '@/contexts/bracket';
import { formatMatchHeaderLine } from '@/lib/tournament/arena/arena-match-label';
import { MATCH_HEADER_ABOVE } from '@/config/bracket';

export interface BracketFinalMatchNodeProps {
  pos: MatchPosition;
}

export function BracketFinalMatchNode({ pos }: BracketFinalMatchNodeProps) {
  const { matchLabel } = useBracket();
  const { match } = pos;
  const headerLine = formatMatchHeaderLine(matchLabel.get(match.id), {
    bothSlotsOpen:
      match.redTournamentAthleteId == null &&
      match.blueTournamentAthleteId == null,
  });

  return (
    <BracketMatchNodeFrame
      pos={pos}
      variant="final"
      direction="ltr"
      className="scale-120"
      header={
        <div
          className="pointer-events-none absolute right-0 left-0 flex flex-col items-center gap-0.5"
          style={{ top: -MATCH_HEADER_ABOVE }}
        >
          {headerLine && (
            <span className="text-muted-foreground text-[10px] leading-none font-medium tabular-nums">
              {headerLine}
            </span>
          )}
        </div>
      }
    />
  );
}
