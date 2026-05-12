import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { TournamentAthleteData } from '@/features/dashboard/types';
import { cn } from '@/lib/utils';

interface PanelAthleteRowProps {
  athlete: TournamentAthleteData;
  groupId: string;
  readOnly: boolean;
}

export function PanelAthleteRow({
  athlete,
  groupId,
  readOnly,
}: PanelAthleteRowProps) {
  const id = `panel-${athlete.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: readOnly,
    data: {
      from: 'panel' as const,
      tournamentAthleteId: athlete.id,
      groupId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-card flex cursor-grab items-center gap-2 rounded-md border px-2 py-2 text-sm active:cursor-grabbing',
        isDragging && 'opacity-60'
      )}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
    >
      <div className="text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded border border-dashed text-xs">
        ⋮
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{athlete.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          Belt {athlete.beltLevel} · {athlete.weight} kg
        </p>
      </div>
    </div>
  );
}
