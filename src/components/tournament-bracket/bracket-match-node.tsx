import { BracketSlot } from './bracket-slot';
import { useSlotLabels } from './use-slot-labels';
import type { BracketSlotDirection } from './bracket-slot';
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
import { cn } from '@/lib/utils';

export interface BracketMatchNodeProps {
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

function slotDirection(wing: MatchPosition['wing']): BracketSlotDirection {
  return wing === 'right' ? 'rtl' : 'ltr';
}

export function BracketMatchNode({
  pos,
  matches,
  athleteMap,
  matchLabel,
  readOnly,
  onSlotClick,
  onToggleLock,
}: BracketMatchNodeProps) {
  const { match } = pos;
  const direction = slotDirection(pos.wing);
  const labels = useSlotLabels(match, matches, athleteMap, matchLabel);

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
      <p className="text-muted-foreground pointer-events-none absolute -top-4 right-0 left-0 truncate text-center text-[10px] leading-none font-medium tabular-nums">
        {formatMatchHeaderLine(matchLabel.get(match.id), {
          bothSlotsOpen:
            match.redTournamentAthleteId == null &&
            match.blueTournamentAthleteId == null,
        })}
      </p>
      <div
        className={cn(
          'bg-card pointer-events-none absolute inset-0 rounded-md border',
          statusBorder[match.status] ?? statusBorder.pending
        )}
      />
      {labels.isRedWinner && (
        <div
          className="pointer-events-none absolute top-px right-px left-px rounded-t-[5px] bg-emerald-500/10"
          style={{ height: ATHLETE_ROW_H - 1 }}
        />
      )}
      {labels.isBlueWinner && (
        <div
          className="pointer-events-none absolute right-px left-px rounded-b-[5px] bg-emerald-500/10"
          style={{
            top: ATHLETE_ROW_H,
            height: ATHLETE_ROW_H - 1,
          }}
        />
      )}
      <div className="bg-border pointer-events-none absolute top-1/2 right-0 left-0 h-px -translate-y-1/2" />

      <BracketSlot
        match={match}
        side="red"
        direction={direction}
        athlete={labels.redAthlete}
        assignedName={labels.redAssignedName}
        emptyLabel={labels.redEmptyLabel}
        locked={match.redLocked}
        wins={match.redWins}
        isWinner={labels.isRedWinner}
        onSlotClick={onSlotClick}
        onToggleLock={() => onToggleLock(match.id, 'red', !match.redLocked)}
        readOnly={readOnly}
      />
      <BracketSlot
        match={match}
        side="blue"
        direction={direction}
        athlete={labels.blueAthlete}
        assignedName={labels.blueAssignedName}
        emptyLabel={labels.blueEmptyLabel}
        locked={match.blueLocked}
        wins={match.blueWins}
        isWinner={labels.isBlueWinner}
        onSlotClick={onSlotClick}
        onToggleLock={() => onToggleLock(match.id, 'blue', !match.blueLocked)}
        readOnly={readOnly}
      />
    </div>
  );
}
