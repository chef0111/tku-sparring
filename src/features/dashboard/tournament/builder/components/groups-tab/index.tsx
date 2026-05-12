import * as React from 'react';
import { DndContext } from '@dnd-kit/core';
import { useQueryState } from 'nuqs';
import { useBuilderManagerQuery } from '../../hooks/use-builder-manager-query';
import { AddGroupDialog } from '../dialogs/add-group-dialog';
import { GroupSettingsDrawer } from '../dialogs/group-settings-drawer';
import { AthletePool } from './athlete-pool';
import { GroupRosterTable } from './group-roster-table';
import { GroupsRail } from './groups-rail';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GroupData } from '@/features/dashboard/types';
import { useAssignAthlete } from '@/queries/groups';
import { useLeases, useRequestLeaseTakeover } from '@/queries/leases';
import { useDeviceId } from '@/hooks/use-device-id';

interface GroupsTabProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
}

export function GroupsTab({ tournamentId, groups, readOnly }: GroupsTabProps) {
  const { selectedGroupId } = useBuilderManagerQuery();
  const [, setSelectedGroup] = useQueryState('group');

  const deviceId = useDeviceId();
  const { data: leases } = useLeases(tournamentId, deviceId);
  const requestTakeover = useRequestLeaseTakeover(tournamentId);
  const assignAthlete = useAssignAthlete();

  const leaseMap = React.useMemo(() => {
    const map = new Map<string, NonNullable<typeof leases>[number]>();
    for (const lease of leases ?? []) {
      map.set(lease.groupId, lease);
    }
    return map;
  }, [leases]);

  const [showAddGroup, setShowAddGroup] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsGroup, setSettingsGroup] = React.useState<GroupData | null>(
    null
  );

  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      void setSelectedGroup(groups[0]!.id);
    }
  }, [selectedGroupId, groups, setSelectedGroup]);

  React.useEffect(() => {
    if (readOnly) {
      setShowAddGroup(false);
      setSettingsOpen(false);
    }
  }, [readOnly]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const athleteId = event.active.data.current?.athleteId as
      | string
      | undefined;
    const targetGroupId = event.over?.data.current?.groupId as
      | string
      | undefined;
    if (!athleteId || !targetGroupId) return;
    if (event.active.data.current?.fromGroupId === targetGroupId) return;
    assignAthlete.mutate({
      groupId: targetGroupId,
      tournamentAthleteId: athleteId,
    });
  };

  const handleOpenSettings = (group: GroupData) => {
    setSettingsGroup(group);
    setSettingsOpen(true);
  };

  const handleRequestTakeover = (groupId: string) => {
    if (!deviceId) return;
    requestTakeover.mutate({ groupId, deviceId });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 w-full">
        <AthletePool
          tournamentId={tournamentId}
          selectedGroupId={selectedGroupId}
          readOnly={readOnly}
        />
        <GroupRosterTable
          group={selectedGroup}
          tournamentId={tournamentId}
          groups={groups}
          readOnly={readOnly}
          leaseInfo={
            selectedGroupId ? leaseMap.get(selectedGroupId) : undefined
          }
          onOpenSettings={handleOpenSettings}
          onRequestTakeover={handleRequestTakeover}
        />
        <GroupsRail
          groups={groups}
          selectedGroupId={selectedGroupId}
          leaseMap={leaseMap}
          readOnly={readOnly}
          onSelect={(id) => void setSelectedGroup(id)}
          onAdd={() => setShowAddGroup(true)}
          onOpenSettings={handleOpenSettings}
        />
      </div>

      <AddGroupDialog
        open={showAddGroup}
        onOpenChange={setShowAddGroup}
        tournamentId={tournamentId}
      />
      <GroupSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        group={settingsGroup}
      />
    </DndContext>
  );
}
