import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
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
      data-dragging={isDragging}
      className={cn(
        'bg-card flex cursor-grab items-center gap-2 rounded-md border px-2 py-2 text-sm active:cursor-grabbing data-dragging:cursor-grabbing',
        isDragging && 'opacity-60'
      )}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
    >
      <button
        type="button"
        data-slot="panel-athlete-drag"
        className="text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-sm text-xs"
      >
        <GripVertical className="size-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{athlete.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          Belt {athlete.beltLevel} · {athlete.weight} kg
        </p>
      </div>
    </div>
  );
}
