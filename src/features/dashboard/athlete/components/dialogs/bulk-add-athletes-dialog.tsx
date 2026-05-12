import * as React from 'react';
import { UserPlus, Users } from 'lucide-react';
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
import {
  LAST_USED_TOURNAMENT_KEY,
  bulkAddAthleteResult,
} from '@/features/dashboard/athlete/lib/bulk-add-athletes';
import { useBulkAddAthletes } from '@/queries/tournament-athletes';
import { useTournaments } from '@/queries/tournaments';
import { Spinner } from '@/components/ui/spinner';

interface BulkAddAthletesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athleteProfileIds: Array<string>;
  onSuccess?: () => void;
}

export function BulkAddAthletesDialog({
  open,
  onOpenChange,
  athleteProfileIds,
  onSuccess,
}: BulkAddAthletesDialogProps) {
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
      bulkAddAthleteResult(result);
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function onSubmit() {
    if (!tournamentId) return;
    localStorage.setItem(LAST_USED_TOURNAMENT_KEY, tournamentId);
    bulkAdd.mutate({ tournamentId, athleteProfileIds, autoAssign });
  }

  function onClose(isOpen: boolean) {
    if (!isOpen) {
      setAutoAssign(false);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
              <SelectTrigger className="w-full">
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
            {bulkAdd.isPending ? (
              <>
                <Spinner className="text-primary-foreground" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <UserPlus />
                <span>Add to Tournament</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
