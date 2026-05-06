import * as React from 'react';
import { IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBulkDeleteAthleteProfiles } from '@/queries/athlete-profiles';
import { Spinner } from '@/components/ui/spinner';

const PREVIEW_NAME_LIMIT = 8;

interface BulkDeleteAthletesDialogProps {
  athletes: Array<{ id: string; name: string }> | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkDeleteAthletesDialog({
  athletes,
  onClose,
  onSuccess,
}: BulkDeleteAthletesDialogProps) {
  const open = !!athletes && athletes.length > 0;
  const ids = React.useMemo(() => athletes?.map((a) => a.id) ?? [], [athletes]);

  const mutation = useBulkDeleteAthleteProfiles({
    onSuccess: () => {
      onClose();
      onSuccess?.();
    },
  });

  const previewNames = athletes?.slice(0, PREVIEW_NAME_LIMIT) ?? [];
  const remaining =
    athletes && athletes.length > PREVIEW_NAME_LIMIT
      ? athletes.length - PREVIEW_NAME_LIMIT
      : 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete athletes</DialogTitle>
          <DialogDescription>
            Delete{' '}
            <span className="font-semibold tabular-nums">
              {athletes?.length ?? 0}
            </span>{' '}
            athlete{athletes && athletes.length !== 1 ? 's' : ''}? They will be
            removed from all tournaments. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {previewNames.length > 0 ? (
          <ul className="text-muted-foreground max-h-40 list-inside list-disc overflow-y-auto text-sm">
            {previewNames.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))}
            {remaining > 0 ? (
              <li className="list-none pl-0">…and {remaining} more</li>
            ) : null}
          </ul>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending || ids.length === 0}
            onClick={() => {
              if (ids.length > 0) mutation.mutate({ ids });
            }}
          >
            {mutation.isPending ? (
              <>
                <Spinner className="text-destructive" />
                <span>'Deleting…'</span>
              </>
            ) : (
              <>
                <IconTrash />
                <span>Delete</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
