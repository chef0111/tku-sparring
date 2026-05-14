import { Trophy } from 'lucide-react';

export function EmptyGroupsPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <Trophy className="text-muted-foreground size-8" />
      </div>
      <h3 className="text-lg font-semibold">No groups yet</h3>
      <p className="text-muted-foreground max-w-xs text-center text-sm">
        Create groups and assign athletes before generating brackets.
      </p>
    </div>
  );
}
