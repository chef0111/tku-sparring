import { BracketSlot } from './bracket-slot';
import { useSlotLabels } from './use-slot-labels';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import {
  ATHLETE_ROW_H,
  MATCH_H,
  MATCH_W,
} from '@/lib/tournament/bracket-layout';
import { formatMatchHeaderLine } from '@/lib/tournament/arena-match-label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BracketFinalMatchNodeProps {
  pos: MatchPosition;
  matches: Array<MatchData>;
  athleteMap: Map<string, TournamentAthleteData>;
  matchLabel: ReadonlyMap<string, number | null>;
  readOnly: boolean;
  onSlotClick: (match: MatchData) => void;
  onToggleLock: (
    matchId: string,
    side: 'red' | 'blue',
    locked: boolean
  ) => void;
}

export function BracketFinalMatchNode({
  pos,
  matches,
  athleteMap,
  matchLabel,
  readOnly,
  onSlotClick,
  onToggleLock,
}: BracketFinalMatchNodeProps) {
  const { match } = pos;
  const labels = useSlotLabels(match, matches, athleteMap, matchLabel);
  const headerLine = formatMatchHeaderLine(matchLabel.get(match.id), {
    bothSlotsOpen:
      match.redTournamentAthleteId == null &&
      match.blueTournamentAthleteId == null,
  });

  const statusBorder: Record<string, string> = {
    pending: 'border-border',
    active: 'border-blue-500',
    complete: 'border-emerald-500',
  };

  return (
    <div
      className="absolute z-1 overflow-visible"
      style={{ left: pos.x, top: pos.y, width: MATCH_W, height: MATCH_H }}
    >
      <div className="pointer-events-none absolute -top-5 right-0 left-0 flex flex-col items-center gap-0.5">
        <Badge
          variant="secondary"
          className="text-[10px] tracking-wider uppercase"
        >
          Final
        </Badge>
        {headerLine ? (
          <span className="text-muted-foreground text-[10px] leading-none font-medium tabular-nums">
            {headerLine}
          </span>
        ) : null}
      </div>

      <div
        aria-hidden
        className={cn(
          'bg-card ring-foreground/15 pointer-events-none absolute inset-0 rounded-md border shadow-md ring-2',
          statusBorder[match.status] ?? statusBorder.pending,
          match.status === 'active' &&
            'shadow-primary/20 motion-safe:shadow-[0_0_12px_-2px]'
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-0 w-1 rounded-l-md bg-red-500"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-1 right-0 w-1 rounded-r-md bg-blue-500"
      />

      {labels.isRedWinner && (
        <div
          className="pointer-events-none absolute top-px right-1 left-1 rounded-t-[5px] bg-emerald-500/10"
          style={{ height: ATHLETE_ROW_H - 1 }}
        />
      )}
      {labels.isBlueWinner && (
        <div
          className="pointer-events-none absolute right-1 left-1 rounded-b-[5px] bg-emerald-500/10"
          style={{
            top: ATHLETE_ROW_H,
            height: ATHLETE_ROW_H - 1,
          }}
        />
      )}
      <div className="bg-border pointer-events-none absolute top-1/2 right-1 left-1 h-px -translate-y-1/2" />

      <BracketSlot
        match={match}
        side="red"
        direction="ltr"
        athlete={labels.redAthlete}
        assignedName={labels.redAssignedName}
        emptyLabel={labels.redEmptyLabel}
        locked={match.redLocked}
        wins={match.redWins}
        isWinner={labels.isRedWinner}
        onSlotClick={onSlotClick}
        onToggleLock={() => onToggleLock(match.id, 'red', !match.redLocked)}
        readOnly={readOnly}
        showSideBar={false}
      />
      <BracketSlot
        match={match}
        side="blue"
        direction="ltr"
        athlete={labels.blueAthlete}
        assignedName={labels.blueAssignedName}
        emptyLabel={labels.blueEmptyLabel}
        locked={match.blueLocked}
        wins={match.blueWins}
        isWinner={labels.isBlueWinner}
        onSlotClick={onSlotClick}
        onToggleLock={() => onToggleLock(match.id, 'blue', !match.blueLocked)}
        readOnly={readOnly}
        showSideBar={false}
      />
    </div>
  );
}
