import { ArrowRight, UserPlus } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { useAutoAssignGroup } from '@/queries/groups';

interface GroupRosterEmptyStateProps {
  variant: 'no-group-selected' | 'no-athletes';
  group?: GroupData | null;
  tournamentId?: string;
  readOnly?: boolean;
}

export function GroupRosterEmptyState({
  variant,
  group,
  tournamentId,
  readOnly,
}: GroupRosterEmptyStateProps) {
  const autoAssign = useAutoAssignGroup();

  if (variant === 'no-group-selected') {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
        <ArrowRight className="size-8 opacity-50" />
        <p>Select a group on the right rail to view its roster.</p>
      </div>
    );
  }

  if (readOnly || !group || !tournamentId) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
        <UserPlus className="size-8 opacity-50" />
        <p>This group has no athletes.</p>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm">
      <UserPlus className="size-8 opacity-50" />
      <p className="text-foreground text-sm font-medium">
        No athletes assigned
      </p>
      <Button
        size="sm"
        onClick={() => autoAssign.mutate({ groupId: group.id, tournamentId })}
        disabled={autoAssign.isPending}
      >
        Auto-assign
      </Button>
      <p className="text-xs">Drag from the pool or click + on a pool row.</p>
    </div>
  );
}
