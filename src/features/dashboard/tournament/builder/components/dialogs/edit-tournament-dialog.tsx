import * as React from 'react';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateTournament } from '@/queries/tournaments';
import { Spinner } from '@/components/ui/spinner';

interface EditTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  currentName: string;
}

export function EditTournamentDialog({
  open,
  onOpenChange,
  tournamentId,
  currentName,
}: EditTournamentDialogProps) {
  const [name, setName] = React.useState(currentName);

  React.useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const mutation = useUpdateTournament({
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutation.mutate({ id: tournamentId, name: name.trim() });
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Tournament</DialogTitle>
            <DialogDescription>Update the tournament name</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tournament name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9.5"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <SaveIcon />
                  <span>Save</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
