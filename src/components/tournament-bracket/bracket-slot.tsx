import * as React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Lock, LockOpen } from 'lucide-react';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { ATHLETE_ROW_H, MATCH_W } from '@/config/bracket';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BracketSlotDirection = 'ltr' | 'rtl';

export interface BracketSlotProps {
  match: MatchData;
  side: 'red' | 'blue';
  direction: BracketSlotDirection;
  athlete: TournamentAthleteData | null | undefined;
  emptyLabel: string;
  assignedName?: string | null;
  locked: boolean;
  wins: number;
  isWinner: boolean;
  isFinal?: boolean;
  onSlotClick: (match: MatchData) => void;
  onToggleLock: () => void;
  readOnly: boolean;
  showIndicator?: boolean;
}

export function BracketSlot({
  match,
  side,
  direction,
  athlete,
  emptyLabel,
  assignedName,
  locked,
  wins,
  isWinner,
  isFinal = false,
  onSlotClick,
  onToggleLock,
  readOnly,
  showIndicator = true,
}: BracketSlotProps) {
  const id = `slot-${match.id}-${side}`;
  const slotLabel = athlete?.name ?? assignedName ?? emptyLabel;
  const canDrag = !locked && !!athlete && match.round === 0 && !readOnly;
  const canDrop = match.round === 0 && !locked;
  const isRtl = direction === 'rtl';

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id,
    disabled: !canDrag,
    data: {
      from: 'slot' as const,
      matchId: match.id,
      side,
      groupId: match.groupId,
      tournamentAthleteId: athlete?.id ?? null,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id,
    disabled: !canDrop,
    data: {
      matchId: match.id,
      side,
      locked,
    },
  });

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  const sideBar = side === 'red' ? 'bg-red-500 mt-px' : 'bg-blue-500 mb-px';
  const rowTop = side === 'red' ? 0 : ATHLETE_ROW_H;

  return (
    <div
      ref={setRefs}
      data-bracket-slot
      style={{
        position: 'absolute',
        left: 0,
        top: rowTop,
        width: MATCH_W,
        height: ATHLETE_ROW_H,
      }}
      className={cn(
        'relative z-2 flex touch-none items-stretch rounded-md bg-transparent active:cursor-grabbing',
        athlete || assignedName ? 'cursor-grab' : 'cursor-pointer',
        locked && 'opacity-50',
        isFinal &&
          side === 'red' &&
          'rounded-b-none border-2 border-b-0 border-red-500',
        isFinal &&
          side === 'blue' &&
          'rounded-t-none border-2 border-t-0 border-blue-500',
        isOver && canDrop && 'ring-primary/30 ring-1',
        isDragging && 'opacity-60',
        isRtl && 'flex-row-reverse'
      )}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      onClick={() => onSlotClick(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSlotClick(match);
      }}
    >
      {showIndicator && (
        <div
          className={cn(
            'w-2 shrink-0',
            isRtl ? 'mr-px rounded-r-lg' : 'ml-px rounded-l-lg',
            sideBar
          )}
        />
      )}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col justify-center px-1.5 py-0.5',
          isRtl ? 'pr-2 pl-1.5' : 'pl-2'
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-center gap-1',
            isRtl && 'flex-row-reverse'
          )}
        >
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock();
              }}
              aria-label={locked ? 'Unlock slot' : 'Lock slot'}
            >
              {locked ? (
                <Lock data-icon="inline-start" className="text-amber-500" />
              ) : (
                <LockOpen data-icon="inline-start" />
              )}
            </Button>
          )}
          <span
            className={cn(
              'min-w-0 text-xs select-none!',
              athlete || assignedName
                ? 'text-foreground'
                : 'text-muted-foreground italic',
              isWinner && 'font-semibold text-emerald-600',
              isRtl && 'text-right'
            )}
          >
            {slotLabel}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center text-xs font-semibold tabular-nums select-none!',
          isWinner ? 'font-semibold text-emerald-600' : 'text-muted-foreground',
          isRtl ? 'pl-2' : 'pr-2'
        )}
      >
        {wins}
      </div>
    </div>
  );
}
