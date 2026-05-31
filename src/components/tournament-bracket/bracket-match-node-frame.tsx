import * as React from 'react';
import { Circle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { BracketSlot } from './bracket-slot';
import type { BracketSlotDirection } from './bracket-slot';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import { useBracket } from '@/contexts/bracket';
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
  className?: string;
}

export function BracketMatchNodeFrame({
  pos,
  variant,
  direction,
  header,
  className,
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

  const finalDecorIcon =
    "border-muted-foreground/15 bg-muted ring-offset-background [&_svg]:text-muted-foreground absolute top-1/2 flex z-100 size-2.5 shrink-0 -translate-y-1/2 rotate-45 items-center justify-center rounded-[4px] border ring-1 ring-zinc-700 ring-offset-1 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-1.5";

  return (
    <div
      className={cn('absolute z-1 overflow-visible', className)}
      style={{ left: pos.x, top: pos.y, width: MATCH_W, height: MATCH_H }}
    >
      {header}

      <div
        aria-hidden={isFinal ? true : undefined}
        className={cn(
          'bg-card pointer-events-none absolute inset-0 rounded-md border',
          statusClass,
          isFinal && 'ring-ring/50 shadow-md ring-2',
          isFinal &&
            match.status === 'active' &&
            'shadow-primary/20 motion-safe:shadow-[0_0_12px_-2px]'
        )}
      />

      {isFinal && (
        <>
          <div className={cn(finalDecorIcon, '-left-1.25')}>
            <Circle aria-hidden="true" />
          </div>
          <Separator
            orientation="horizontal"
            className="absolute top-1/2 z-50 h-1! -translate-y-1/2 bg-zinc-700 px-1"
          />
          <div className={cn(finalDecorIcon, '-right-1.25')}>
            <Circle aria-hidden="true" />
          </div>
        </>
      )}

      {labels.isRedWinner && (
        <div
          className="pointer-events-none absolute inset-x-0 top-px rounded-t-[5px] bg-emerald-500/10"
          style={{ height: ATHLETE_ROW_H - 1 }}
        />
      )}
      {labels.isBlueWinner && (
        <div
          className="pointer-events-none absolute inset-x-0 rounded-b-[5px] bg-emerald-500/10"
          style={{
            top: ATHLETE_ROW_H,
            height: ATHLETE_ROW_H - 1,
          }}
        />
      )}

      <div className="bg-border pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />

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
        isFinal={isFinal}
        onSlotClick={onSlotClick}
        onToggleLock={() => onToggleLock(match.id, 'red', !match.redLocked)}
        readOnly={readOnly}
        showIndicator={!isFinal}
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
        isFinal={isFinal}
        onSlotClick={onSlotClick}
        onToggleLock={() => onToggleLock(match.id, 'blue', !match.blueLocked)}
        readOnly={readOnly}
        showIndicator={!isFinal}
      />
    </div>
  );
}
