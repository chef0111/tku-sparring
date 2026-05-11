import * as React from 'react';

import { SaveIcon } from 'lucide-react';
import type { TournamentListItem } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useUpdateTournament } from '@/queries/tournaments';

interface RenameTournamentDialogProps {
  tournament: TournamentListItem | null;
  onOpenChange: () => void;
}

export function RenameTournamentDialog({
  tournament,
  onOpenChange,
}: RenameTournamentDialogProps) {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    setName(tournament?.name ?? '');
  }, [tournament?.id, tournament?.name]);

  const mutation = useUpdateTournament({ onSuccess: onOpenChange });

  const open = !!tournament;
  const trimmed = name.trim();
  const isUnchanged = trimmed === tournament?.name;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tournament || !trimmed || isUnchanged) return;
    mutation.mutate({ id: tournament.id, name: trimmed });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange();
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename tournament</DialogTitle>
            <DialogDescription>
              Choose a new name. Athletes, groups, and matches stay attached.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tournament name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onOpenChange}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!trimmed || isUnchanged || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
