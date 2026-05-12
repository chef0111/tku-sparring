import { useDroppable } from '@dnd-kit/core';
import { GroupsTabsHeader } from './groups-tabs-header';
import { PanelAthleteRow } from './panel-athlete-row';
import type {
  GroupData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { cn } from '@/lib/utils';

interface GroupsPanelProps {
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
  athletes: Array<TournamentAthleteData>;
  readOnly: boolean;
  slotReturnEnabled: boolean;
  groupAthleteCount: number;
}

export function GroupsPanel({
  groups,
  selectedGroupId,
  onSelect,
  athletes,
  readOnly,
  slotReturnEnabled,
  groupAthleteCount,
}: GroupsPanelProps) {
  const poolDrop = useDroppable({
    id: `bracket-panel-pool-${selectedGroupId ?? 'none'}`,
    disabled: readOnly || !selectedGroupId || !slotReturnEnabled,
    data: {
      from: 'panel-drop' as const,
      groupId: selectedGroupId,
    },
  });

  return (
    <aside className="bg-sidebar/30 flex h-full min-h-0 w-xs shrink-0 flex-col border-l">
      <GroupsTabsHeader
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelect={onSelect}
      />
      <div
        ref={poolDrop.setNodeRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto transition-colors',
          poolDrop.isOver && slotReturnEnabled && !readOnly && 'bg-primary/5'
        )}
      >
        <div className="flex flex-col gap-1.5 p-2">
          {athletes.length === 0 ? (
            <p className="text-muted-foreground px-2 py-4 text-center text-sm">
              {groupAthleteCount === 0
                ? 'No athletes in this group.'
                : slotReturnEnabled && !readOnly
                  ? 'All athletes are in round 1 slots. Drag from the bracket here to remove an athlete.'
                  : 'No athletes to show.'}
            </p>
          ) : (
            athletes.map((a) => (
              <PanelAthleteRow
                key={a.id}
                athlete={a}
                groupId={selectedGroupId ?? ''}
                readOnly={readOnly}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
