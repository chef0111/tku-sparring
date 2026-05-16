import type { TournamentStatus } from '@/features/dashboard/types';
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

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

function riskNotes(
  from: TournamentStatus,
  to: TournamentStatus
): Array<string> {
  const notes: Array<string> = [];
  if (from === 'completed' && to !== 'completed') {
    notes.push('Moving away from Completed re-enables editing in the builder.');
  }
  if (to === 'completed') {
    notes.push('Completed marks the tournament workspace read-only.');
  }
  if (to === 'draft' && from !== 'draft') {
    notes.push(
      'Moving to Draft restores draft-only bracket operations where applicable.'
    );
  }
  if (to === 'active' && from === 'draft') {
    notes.push(
      'Active allows live scoring and arena selection for active tournaments.'
    );
  }
  if (notes.length === 0) {
    notes.push('This is an administrative status override.');
  }
  return notes;
}

interface TournamentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  fromStatus: TournamentStatus;
  toStatus: TournamentStatus | null;
  isPending: boolean;
  onConfirm: () => void;
}

export function TournamentStatusDialog({
  open,
  onOpenChange,
  tournamentName,
  fromStatus,
  toStatus,
  isPending,
  onConfirm,
}: TournamentStatusDialogProps) {
  if (!toStatus) return null;

  const bullets = riskNotes(fromStatus, toStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Update tournament status?
          </DialogTitle>
          <DialogDescription className="text-base font-light">
            Tournament: <span className="font-semibold">{tournamentName}</span>{' '}
            <br />
            From{' '}
            <span className="font-semibold">
              {STATUS_LABEL[fromStatus]}
            </span> to{' '}
            <span className="font-semibold">{STATUS_LABEL[toStatus]}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="text-muted-foreground mb-2">
          <ul className="flex flex-col gap-1">
            {bullets.map((line, index) => (
              <span key={index} className="italic">
                {line}
              </span>
            ))}
          </ul>
        </div>
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
