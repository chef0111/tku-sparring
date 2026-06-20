import * as React from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateDivision } from '@/queries/division';
import { Spinner } from '@/components/ui/spinner';

interface AddDivisionDialogProps {
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

export function AddDivisionDialog({
  onOpenChange,
  tournamentId,
}: AddDivisionDialogProps) {
  const [name, setName] = React.useState('');

  const mutation = useCreateDivision({
    onSuccess: () => {
      onOpenChange(false);
      setName('');
    },
  });

  return (
    <DialogContent>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          mutation.mutate({ name: name.trim(), tournamentId });
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Add Division</DialogTitle>
          <DialogDescription>
            Create a new division for this tournament
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Division name"
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
                <Spinner />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <PlusIcon />
                <span>Add division</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
