import { Trash2 } from 'lucide-react';
import type { AthleteProfileData } from '@/contracts/athlete/profile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteAthleteProfile } from '@/queries/athlete-profile';
import { Spinner } from '@/components/ui/spinner';

interface DeleteAthleteDialogProps {
  athlete: AthleteProfileData | null;
  onClose: () => void;
}

export function DeleteAthleteDialog({
  athlete,
  onClose,
}: DeleteAthleteDialogProps) {
  const mutation = useDeleteAthleteProfile({ onSuccess: onClose });

  return (
    <Dialog open={!!athlete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">Delete Athlete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold">{athlete?.name}</span>? This will
            also remove them from all tournaments. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => {
              if (athlete) mutation.mutate({ id: athlete.id });
            }}
          >
            {mutation.isPending ? (
              <>
                <Spinner />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
