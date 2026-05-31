import { BracketMatchNodeFrame } from './bracket-match-node-frame';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import { useBracket } from '@/contexts/bracket';
import { formatMatchHeaderLine } from '@/lib/tournament/arena-match-label';
import { MATCH_HEADER_ABOVE } from '@/config/bracket';

export interface BracketMatchNodeProps {
  pos: MatchPosition;
}

export function BracketMatchNode({ pos }: BracketMatchNodeProps) {
  const { matchLabel } = useBracket();
  const { match } = pos;
  const direction = pos.wing === 'right' ? 'rtl' : 'ltr';

  return (
    <BracketMatchNodeFrame
      pos={pos}
      variant="standard"
      direction={direction}
      header={
        <p
          className="text-muted-foreground pointer-events-none absolute right-0 left-0 truncate text-center text-[10px] leading-none font-medium tabular-nums"
          style={{ top: -MATCH_HEADER_ABOVE }}
        >
          {formatMatchHeaderLine(matchLabel.get(match.id), {
            bothSlotsOpen:
              match.redTournamentAthleteId == null &&
              match.blueTournamentAthleteId == null,
          })}
        </p>
      }
    />
  );
}
