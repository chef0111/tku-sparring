import * as React from 'react';
import { PlusIcon } from 'lucide-react';
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
import { useCreateGroup } from '@/queries/groups';
import { Spinner } from '@/components/ui/spinner';

interface AddGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

export function AddGroupDialog({
  open,
  onOpenChange,
  tournamentId,
}: AddGroupDialogProps) {
  const [name, setName] = React.useState('');

  const mutation = useCreateGroup({
    onSuccess: () => {
      onOpenChange(false);
      setName('');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setName('');
      }}
    >
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutation.mutate({ name: name.trim(), tournamentId });
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg">Add Group</DialogTitle>
            <DialogDescription>
              Create a new group for this tournament
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <PlusIcon />
                  <span>Add group</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
