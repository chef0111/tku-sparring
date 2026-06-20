import { ArrowRight, UserPlus } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
import { Button } from '@/components/ui/button';
import { useAutoAssignDivision } from '@/queries/division';
import { Spinner } from '@/components/ui/spinner';

interface DivisionRosterEmptyStateProps {
  variant: 'no-division-selected' | 'no-athletes';
  division?: DivisionData | null;
  tournamentId?: string;
  readOnly?: boolean;
}

export function DivisionRosterEmptyState({
  variant,
  division,
  tournamentId,
  readOnly,
}: DivisionRosterEmptyStateProps) {
  const autoAssign = useAutoAssignDivision();

  if (variant === 'no-division-selected') {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
        <ArrowRight className="size-8 opacity-50" />
        <p>Select a division on the right rail to view its roster.</p>
      </div>
    );
  }

  if (readOnly || !division || !tournamentId) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm">
        <UserPlus className="size-8 opacity-50" />
        <p>This division has no athletes.</p>
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
        onClick={() =>
          autoAssign.mutate({ divisionId: division.id, tournamentId })
        }
        disabled={autoAssign.isPending}
      >
        {autoAssign.isPending ? (
          <>
            <Spinner />
            Assigning…
          </>
        ) : (
          'Auto-assign'
        )}
      </Button>
      <p className="text-xs">Drag from the pool or click + on a pool row.</p>
    </div>
  );
}
