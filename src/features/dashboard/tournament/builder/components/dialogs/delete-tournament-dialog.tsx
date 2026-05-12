import { TrashIcon } from 'lucide-react';
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
import { useDeleteTournament } from '@/queries/tournaments';

interface DeleteTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  tournamentName: string;
}

export function DeleteTournamentDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
}: DeleteTournamentDialogProps) {
  const mutation = useDeleteTournament();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive text-lg">
            Delete Tournament
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete{' '}
              <b>&quot;{tournamentName}&quot;</b>?
            </p>
            <p>
              This will permanently remove all groups, athletes, and matches.
              This action cannot be undone.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: tournamentId })}
          >
            {mutation.isPending ? (
              <>
                <Spinner className="text-destructive" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="text-destructive" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
