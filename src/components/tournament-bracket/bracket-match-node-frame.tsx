import * as React from 'react';
import { BracketSlot } from './bracket-slot';
import { useBracket } from './bracket-context';
import type { BracketSlotDirection } from './bracket-slot';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import { useSlotLabels } from '@/hooks/use-slot-labels';
import {
  ATHLETE_ROW_H,
  MATCH_H,
  MATCH_W,
} from '@/lib/tournament/bracket-layout';
import { cn } from '@/lib/utils';

export const matchStatusBorder: Record<string, string> = {
  pending: 'border-border',
  active: 'border-blue-500',
  complete: 'border-emerald-500',
};

export interface BracketMatchNodeFrameProps {
  pos: MatchPosition;
  variant: 'standard' | 'final';
  direction: BracketSlotDirection;
  header: React.ReactNode;
}

export function BracketMatchNodeFrame({
  pos,
  variant,
  direction,
  header,
}: BracketMatchNodeFrameProps) {
  const { match } = pos;
  const {
    matches,
    athleteMap,
    matchLabel,
    readOnly,
    onSlotClick,
    onToggleLock,
  } = useBracket();
  const labels = useSlotLabels(match, matches, athleteMap, matchLabel);

  const isFinal = variant === 'final';
  const statusClass =
    matchStatusBorder[match.status] ?? matchStatusBorder.pending;

  return (
    <div
      className="absolute z-1 overflow-visible"
      style={{ left: pos.x, top: pos.y, width: MATCH_W, height: MATCH_H }}
    >
      {header}

      <div
        aria-hidden={isFinal ? true : undefined}
        className={cn(
          'bg-card pointer-events-none absolute inset-0 rounded-md border',
          statusClass,
          isFinal && 'ring-foreground/15 shadow-md ring-2',
          isFinal &&
            match.status === 'active' &&
            'shadow-primary/20 motion-safe:shadow-[0_0_12px_-2px]'
        )}
      />

      {isFinal && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-1 left-0 w-1 rounded-l-md bg-red-500"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-1 right-0 w-1 rounded-r-md bg-blue-500"
          />
        </>
      )}

      {labels.isRedWinner && (
        <div
          className={cn(
            'pointer-events-none absolute top-px rounded-t-[5px] bg-emerald-500/10',
            isFinal ? 'right-1 left-1' : 'right-px left-px'
          )}
          style={{ height: ATHLETE_ROW_H - 1 }}
        />
      )}
      {labels.isBlueWinner && (
        <div
          className={cn(
            'pointer-events-none absolute rounded-b-[5px] bg-emerald-500/10',
            isFinal ? 'right-1 left-1' : 'right-px left-px'
          )}
          style={{
            top: ATHLETE_ROW_H,
            height: ATHLETE_ROW_H - 1,
          }}
        />
      )}

      <div
        className={cn(
          'bg-border pointer-events-none absolute top-1/2 h-px -translate-y-1/2',
          isFinal ? 'right-1 left-1' : 'right-0 left-0'
        )}
      />

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
        showSideBar={!isFinal}
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
        showSideBar={!isFinal}
      />
    </div>
  );
}
