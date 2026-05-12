import * as React from 'react';
import { GroupsTabsHeader } from './groups-tabs-header';
import { PanelAthleteRow } from './panel-athlete-row';
import type {
  GroupData,
  TournamentAthleteData,
} from '@/features/dashboard/types';

interface GroupsPanelProps {
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
  athletes: Array<TournamentAthleteData>;
  readOnly: boolean;
}

export function GroupsPanel({
  groups,
  selectedGroupId,
  onSelect,
  athletes,
  readOnly,
}: GroupsPanelProps) {
  return (
    <aside className="bg-sidebar/30 flex h-full min-h-0 w-72 shrink-0 flex-col border-l">
      <GroupsTabsHeader
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelect={onSelect}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1.5 p-2">
          {athletes.length === 0 ? (
            <p className="text-muted-foreground px-2 py-4 text-center text-sm">
              No athletes in this group.
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
