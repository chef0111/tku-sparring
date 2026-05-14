import * as React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Lock, LockOpen } from 'lucide-react';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { ATHLETE_ROW_H, MATCH_W } from '@/lib/tournament/bracket-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BracketSlotProps {
  match: MatchData;
  side: 'red' | 'blue';
  athlete: TournamentAthleteData | null | undefined;
  emptyLabel: string;
  locked: boolean;
  wins: number;
  isWinner: boolean;
  onSlotClick: (match: MatchData) => void;
  onToggleLock: () => void;
  readOnly: boolean;
}

export function BracketSlot({
  match,
  side,
  athlete,
  emptyLabel,
  locked,
  wins,
  isWinner,
  onSlotClick,
  onToggleLock,
  readOnly,
}: BracketSlotProps) {
  const id = `slot-${match.id}-${side}`;
  const canDrag = !locked && !!athlete && match.round === 0 && !readOnly;
  const canDrop = match.round === 0 && !locked;

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

  const sideBar = side === 'red' ? 'bg-red-500' : 'bg-blue-500';
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
        'relative z-2 flex cursor-grab touch-none items-stretch rounded-md border border-transparent bg-transparent active:cursor-grabbing',
        locked && 'border-amber-500/60',
        isOver && canDrop && 'ring-primary/40 ring-2',
        isDragging && 'opacity-60'
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
      <div className={cn('w-1.5 shrink-0 rounded-l-lg', sideBar)} />

      <div className="flex min-w-0 flex-1 flex-col justify-center px-1.5 py-0.5 pl-2">
        <div className="flex min-w-0 items-center gap-1">
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock();
              }}
              aria-label={locked ? 'Unlock slot' : 'Lock slot'}
            >
              {locked ? (
                <Lock data-icon="inline-start" />
              ) : (
                <LockOpen data-icon="inline-start" />
              )}
            </Button>
          )}
          {athlete?.seed != null && (
            <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
              {athlete.seed}
            </span>
          )}
          <span
            className={cn(
              'min-w-0 text-xs',
              athlete ? 'text-foreground' : 'text-muted-foreground italic',
              isWinner && 'font-semibold text-emerald-600'
            )}
          >
            {athlete ? athlete.name : emptyLabel}
          </span>
        </div>
        {athlete && (
          <p className="text-muted-foreground truncate pl-1 text-[10px]">
            Belt {athlete.beltLevel} · {athlete.weight} kg
          </p>
        )}
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center pr-2 text-xs font-semibold tabular-nums',
          isWinner ? 'font-semibold text-emerald-600' : 'text-muted-foreground'
        )}
      >
        {wins}
      </div>
    </div>
  );
}
