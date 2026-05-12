import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
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
import { client } from '@/orpc/client';
import { invalidateOrpcGroupListQueries } from '@/queries/groups';

interface AutoAssignAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  groups: Array<GroupData>;
}

export function AutoAssignAllDialog({
  open,
  onOpenChange,
  tournamentId,
  groups,
}: AutoAssignAllDialogProps) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = React.useState(false);

  const { eligible, skipped } = React.useMemo(() => {
    const eligibleList: Array<GroupData> = [];
    const skippedList: Array<GroupData> = [];
    for (const group of groups) {
      if (group._count.matches === 0) eligibleList.push(group);
      else skippedList.push(group);
    }
    return { eligible: eligibleList, skipped: skippedList };
  }, [groups]);

  const handleRun = async () => {
    if (eligible.length === 0) return;
    setIsRunning(true);
    let assignedSum = 0;
    try {
      for (const group of eligible) {
        const result = await client.group.autoAssign({
          groupId: group.id,
          tournamentId,
        });
        assignedSum += result.assigned;
      }
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      await invalidateOrpcGroupListQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['tournamentAthlete'] });
      toast.success(
        `Auto-assigned ${assignedSum} athletes across ${eligible.length} groups (skipped ${skipped.length})`
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Auto-assign failed');
    } finally {
      setIsRunning(false);
    }
  };

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
          <DialogTitle>Auto-assign all groups</DialogTitle>
          <DialogDescription>
            Distribute unassigned athletes into eligible groups based on their
            constraints. Groups that already have matches are skipped.
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
                No eligible groups.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {eligible.map((group) => (
                  <li
                    key={group.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="truncate">{group.name}</span>
                    <Badge variant="secondary" className="tabular-nums">
                      {group._count.tournamentAthletes}
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
                {skipped.map((group) => (
                  <li
                    key={group.id}
                    className="text-muted-foreground flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{group.name}</span>
                      <span className="text-xs">Already has matches</span>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {group._count.tournamentAthletes}
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
