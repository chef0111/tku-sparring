import { BracketMatchNodeFrame } from './bracket-match-node-frame';
import { useBracket } from './bracket-context';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import { formatMatchHeaderLine } from '@/lib/tournament/arena-match-label';

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
        <div className="pointer-events-none absolute -top-5 right-0 left-0 flex flex-col items-center gap-0.5">
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
