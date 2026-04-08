import * as React from 'react';
import type { GroupData } from '../../types';
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
import {
  useCreateGroup,
  useDeleteGroup,
  useUpdateGroup,
} from '@/queries/groups';
import {
  useDeleteTournament,
  useUpdateTournament,
} from '@/queries/tournaments';

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
            <DialogTitle>Add Group</DialogTitle>
            <DialogDescription>
              Create a new group for this tournament.
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
              {mutation.isPending ? 'Creating...' : 'Add Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditGroupDialogProps {
  group: GroupData | null;
  onClose: () => void;
  onDeleteRequest: (group: GroupData) => void;
}

export function EditGroupDialog({
  group,
  onClose,
  onDeleteRequest,
}: EditGroupDialogProps) {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (group) setName(group.name);
  }, [group]);

  const mutation = useUpdateGroup({
    onSuccess: () => {
      onClose();
      setName('');
    },
  });

  return (
    <Dialog
      open={!!group}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!group || !name.trim()) return;
            mutation.mutate({ id: group.id, name: name.trim() });
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update the group name or delete this group.
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
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (group) {
                  onDeleteRequest(group);
                  onClose();
                }
              }}
            >
              Delete
            </Button>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteGroupDialogProps {
  group: GroupData | null;
  onClose: () => void;
}

export function DeleteGroupDialog({ group, onClose }: DeleteGroupDialogProps) {
  const mutation = useDeleteGroup({ onSuccess: onClose });

  return (
    <Dialog
      open={!!group}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{group?.name}&quot;? This will
            also delete all athletes and matches in this group. This action
            cannot be undone.
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
              if (group) mutation.mutate({ id: group.id });
            }}
          >
            {mutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>Update the tournament name.</DialogDescription>
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
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
          <DialogTitle>Delete Tournament</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{tournamentName}&quot;? This
            will permanently remove all groups, athletes, and matches. This
            action cannot be undone.
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
            {mutation.isPending ? 'Deleting...' : 'Delete Tournament'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
