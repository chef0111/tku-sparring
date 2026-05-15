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

interface MatchStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human label for the status being applied (e.g. "Pending"). */
  targetStatusLabel: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function MatchStatusDialog({
  open,
  onOpenChange,
  targetStatusLabel,
  isPending,
  onConfirm,
}: MatchStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change match status?</DialogTitle>
          <DialogDescription>
            Scores and declared winner for this match will be cleared when
            moving to {targetStatusLabel || 'the selected status'}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Spinner
                  data-icon="inline-start"
                  className="text-primary-foreground"
                />
                Saving…
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
