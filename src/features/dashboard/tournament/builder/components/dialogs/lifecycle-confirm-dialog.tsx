import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useSetTournamentStatus } from '@/queries/tournaments';

interface LifecycleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: 'active' | 'completed';
  tournamentId: string;
  tournamentName: string;
}

export function LifecycleConfirmDialog({
  open,
  onOpenChange,
  target,
  tournamentId,
  tournamentName,
}: LifecycleConfirmDialogProps) {
  const mutation = useSetTournamentStatus({
    onSuccess: () => onOpenChange(false),
  });

  const copy =
    target === 'active'
      ? {
          title: 'Activate tournament',
          description: `This will move ${tournamentName} into the active state so live results can begin.`,
          confirmLabel: 'Activate',
        }
      : {
          title: 'Complete tournament',
          description: `This will mark ${tournamentName} as completed and make the tournament workspace read-only.`,
          confirmLabel: 'Complete tournament',
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              mutation.mutate({ id: tournamentId, status: target })
            }
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Spinner className="text-destructive" />
                Saving...
              </>
            ) : (
              copy.confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
