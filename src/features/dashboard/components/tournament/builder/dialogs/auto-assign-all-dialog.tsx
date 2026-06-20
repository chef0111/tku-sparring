import * as React from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAutoAssignAll } from '@/queries/division';

interface AutoAssignAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  divisions: Array<DivisionData>;
}

export function AutoAssignAllDialog({
  open,
  onOpenChange,
  tournamentId,
  divisions,
}: AutoAssignAllDialogProps) {
  const autoAssignAll = useAutoAssignAll();

  const { eligible, skipped } = React.useMemo(() => {
    const eligibleList: Array<DivisionData> = [];
    const skippedList: Array<DivisionData> = [];
    for (const division of divisions) {
      if (division._count.matches === 0) eligibleList.push(division);
      else skippedList.push(division);
    }
    return { eligible: eligibleList, skipped: skippedList };
  }, [divisions]);

  const handleRun = () => {
    if (eligible.length === 0) return;
    autoAssignAll.mutate(
      { tournamentId },
      {
        onSuccess: (result) => {
          toast.success(
            `Auto-assigned ${result.assigned} athletes across ${result.divisionsRun} divisions (skipped ${result.divisionsSkipped})`
          );
          onOpenChange(false);
        },
      }
    );
  };

  const isRunning = autoAssignAll.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isRunning) return;
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auto-assign all divisions</DialogTitle>
          <DialogDescription>
            Distribute unassigned athletes into eligible divisions based on
            their constraints. Divisions that already have matches are skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-4 overflow-y-auto py-2">
          <section className="space-y-2">
            <h3 className="text-sm font-medium">
              Will run{' '}
              <span className="text-muted-foreground font-normal">
                ({eligible.length})
              </span>
            </h3>
            {eligible.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No eligible divisions.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {eligible.map((division) => (
                  <li
                    key={division.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="truncate">{division.name}</span>
                    <Badge variant="secondary" className="tabular-nums">
                      {division._count.tournamentAthletes}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {skipped.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">
                Skipped{' '}
                <span className="text-muted-foreground font-normal">
                  ({skipped.length})
                </span>
              </h3>
              <ul className="divide-y rounded-md border">
                {skipped.map((division) => (
                  <li
                    key={division.id}
                    className="text-muted-foreground flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{division.name}</span>
                      <span className="text-xs">Already has matches</span>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {division._count.tournamentAthletes}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRun}
            disabled={isRunning || eligible.length === 0}
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              'Run'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
