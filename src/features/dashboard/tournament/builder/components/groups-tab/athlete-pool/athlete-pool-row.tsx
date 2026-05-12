import { Plus } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { toast } from 'sonner';
import type { TournamentAthleteData } from '@/features/dashboard/types';
import { getBeltLabel } from '@/config/athlete';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAssignAthlete } from '@/queries/groups';
import { cn } from '@/lib/utils';

interface AthletePoolRowProps {
  athlete: TournamentAthleteData;
  selectedGroupId: string | null;
  readOnly: boolean;
}

export function AthletePoolRow({
  athlete,
  selectedGroupId,
  readOnly,
}: AthletePoolRowProps) {
  const assignAthlete = useAssignAthlete({ suppressErrorToast: true });
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: athlete.id,
    data: { type: 'pool-athlete', athleteId: athlete.id },
    disabled: readOnly,
  });

  const canAssign = !!selectedGroupId && !readOnly;

  const handleAssign = () => {
    if (!canAssign) return;
    void toast.promise(
      assignAthlete.mutateAsync({
        groupId: selectedGroupId!,
        tournamentAthleteId: athlete.id,
      }),
      {
        loading: 'Adding to group…',
        success: 'Added to group',
        error: (err) =>
          err instanceof Error ? err.message : 'Could not add athlete',
      }
    );
  };

  const plusButton = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="absolute top-6 right-2 size-7 shrink-0 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        handleAssign();
      }}
      disabled={!canAssign || assignAthlete.isPending}
    >
      <Plus className="size-3.5" />
    </Button>
  );

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative flex cursor-grab items-center gap-2 px-3 py-2 pr-10 active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{athlete.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {athlete.affiliation}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {getBeltLabel(athlete.beltLevel)}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {athlete.weight}kg
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {athlete.gender}
          </Badge>
        </div>
      </div>

      {canAssign ? (
        plusButton
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{plusButton}</span>
          </TooltipTrigger>
          <TooltipContent>
            {readOnly ? 'Read-only workspace' : 'Select a group first'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
