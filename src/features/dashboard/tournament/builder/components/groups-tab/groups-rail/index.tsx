import { Plus } from 'lucide-react';
import { GroupRailRow } from './group-rail-row';
import type { GroupData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';

interface GroupsRailProps {
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  readOnly: boolean;
  onSelect: (groupId: string) => void;
  onAdd: () => void;
  onOpenSettings: (group: GroupData) => void;
}

export function GroupsRail({
  groups,
  selectedGroupId,
  readOnly,
  onSelect,
  onAdd,
  onOpenSettings,
}: GroupsRailProps) {
  return (
    <div className="bg-card flex w-64 shrink-0 flex-col overflow-hidden border-l">
      {!readOnly && (
        <div className="border-b p-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onAdd}
          >
            <Plus className="mr-1 size-3.5" />
            Add Group
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">
            No groups yet <br /> Click + Add Group above
          </div>
        ) : (
          <div className="divide-y">
            {groups.map((group) => (
              <GroupRailRow
                key={group.id}
                group={group}
                active={group.id === selectedGroupId}
                readOnly={readOnly}
                onSelect={onSelect}
                onOpenSettings={onOpenSettings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
