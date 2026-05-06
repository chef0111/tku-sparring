import * as React from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBulkAddAthletes } from '@/queries/tournament-athletes';
import { useTournaments } from '@/queries/tournaments';

const LAST_USED_TOURNAMENT_KEY = 'tku:lastUsedTournamentId';

interface BulkAddToTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athleteProfileIds: Array<string>;
  onSuccess?: () => void;
}

export function BulkAddToTournamentDialog({
  open,
  onOpenChange,
  athleteProfileIds,
  onSuccess,
}: BulkAddToTournamentDialogProps) {
  const { data: tournaments = [] } = useTournaments();
  const [tournamentId, setTournamentId] = React.useState<string>('');
  const [autoAssign, setAutoAssign] = React.useState(false);

  // Restore last-used tournament
  React.useEffect(() => {
    if (open) {
      const lastUsed = localStorage.getItem(LAST_USED_TOURNAMENT_KEY);
      if (lastUsed && tournaments.some((t) => t.id === lastUsed)) {
        setTournamentId(lastUsed);
      }
    }
  }, [open, tournaments]);

  const bulkAdd = useBulkAddAthletes({
    onSuccess: (result) => {
      const { added, unassigned } = result;
      if (added === 0) {
        toast.info('All selected athletes are already in this tournament.');
      } else if (unassigned === added) {
        toast.success(
          `Added ${added} athlete${added !== 1 ? 's' : ''} to the unassigned pool.`
        );
      } else {
        toast.success(
          `Added ${added} athlete${added !== 1 ? 's' : ''}. ${result.assigned} assigned, ${unassigned} unassigned.`
        );
      }
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function onSubmit() {
    if (!tournamentId) return;
    localStorage.setItem(LAST_USED_TOURNAMENT_KEY, tournamentId);
    bulkAdd.mutate({ tournamentId, athleteProfileIds, autoAssign });
  }

  function onClose(open: boolean) {
    if (!open) {
      setAutoAssign(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Tournament</DialogTitle>
          <DialogDescription>
            Add{' '}
            <span className="font-semibold">
              {athleteProfileIds.length} selected athlete
              {athleteProfileIds.length !== 1 ? 's' : ''}
            </span>{' '}
            to a tournament.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Tournament</Label>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                    No tournaments found
                  </div>
                ) : (
                  tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="autoAssign"
              checked={autoAssign}
              onCheckedChange={(v) => setAutoAssign(!!v)}
            />
            <Label htmlFor="autoAssign" className="cursor-pointer font-normal">
              Auto-assign by group constraints
            </Label>
          </div>

          {autoAssign && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Users className="size-3.5 shrink-0" />
              Athletes will be placed in groups matching their gender, belt, and
              weight. Unmatched athletes go to the unassigned pool.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={!tournamentId || bulkAdd.isPending}
            onClick={onSubmit}
          >
            {bulkAdd.isPending ? 'Adding...' : 'Add to Tournament'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
