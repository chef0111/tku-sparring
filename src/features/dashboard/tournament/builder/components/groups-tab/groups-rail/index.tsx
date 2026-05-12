import { Plus } from 'lucide-react';
import { GroupRailRow } from './group-rail-row';
import type { GroupData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';

type LeaseStatus =
  | 'available'
  | 'held_by_me'
  | 'held_by_other'
  | 'pending_takeover';

interface LeaseInfo {
  leaseStatus: LeaseStatus;
}

interface GroupsRailProps {
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  leaseMap: Map<string, LeaseInfo>;
  readOnly: boolean;
  onSelect: (groupId: string) => void;
  onAdd: () => void;
  onOpenSettings: (group: GroupData) => void;
}

export function GroupsRail({
  groups,
  selectedGroupId,
  leaseMap,
  readOnly,
  onSelect,
  onAdd,
  onOpenSettings,
}: GroupsRailProps) {
  return (
    <div className="bg-card flex w-56 shrink-0 flex-col overflow-hidden border-l">
      {!readOnly && (
        <div className="border-b p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onAdd}
          >
            <Plus className="mr-1 size-3.5" />
            Add Group
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-xs">
            No groups yet. Click + Add Group above.
          </div>
        ) : (
          <div className="divide-y">
            {groups.map((group) => (
              <GroupRailRow
                key={group.id}
                group={group}
                active={group.id === selectedGroupId}
                readOnly={readOnly}
                leaseInfo={leaseMap.get(group.id)}
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
