import { LayoutGrid, Plus } from 'lucide-react';
import type { GroupData } from '../../types';
import { Button } from '@/components/ui/button';

interface BuilderCanvasProps {
  groups: Array<GroupData>;
  onAddGroup: () => void;
}

export function BuilderCanvas({ groups, onAddGroup }: BuilderCanvasProps) {
  if (groups.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="bg-muted flex size-20 items-center justify-center rounded-full">
          <LayoutGrid className="text-muted-foreground size-10" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">No groups yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            Create your first group to start building brackets for this
            tournament.
          </p>
        </div>
        <Button onClick={onAddGroup}>
          <Plus className="size-4" />
          Create your first group
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <LayoutGrid className="text-muted-foreground size-8" />
        </div>
        <h3 className="text-lg font-semibold">Canvas workspace</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Bracket canvas will be implemented here.
          <br />
          {groups.length} group{groups.length !== 1 && 's'} ready.
        </p>
      </div>
    </div>
  );
}
