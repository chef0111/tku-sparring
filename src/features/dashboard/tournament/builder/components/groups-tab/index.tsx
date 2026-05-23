import * as React from 'react';
import { DndContext } from '@dnd-kit/core';
import { toast } from 'sonner';
import { useBuilderManagerQuery } from '../../hooks/use-builder-manager-query';
import { AddGroupDialog } from '../dialogs/add-group-dialog';
import { GroupSettingsSheet } from '../dialogs/group-settings-sheet';
import { AddAthletesSheet } from './add-athletes-sheet';
import { AthletePool } from './athlete-pool';
import { GroupRosterTable } from './group-roster-table';
import { GroupsRail } from './groups-rail';
import type { DragEndEvent } from '@dnd-kit/core';
import type { GroupData } from '@/features/dashboard/types';
import { useAssignAthlete } from '@/queries/groups';

interface GroupsTabProps {
  tournamentId: string;
  tournamentName: string;
  groups: Array<GroupData>;
  readOnly: boolean;
}

export function GroupsTab({
  tournamentId,
  tournamentName,
  groups,
  readOnly,
}: GroupsTabProps) {
  const { selectedGroupId, setSelectedGroup, addAthletes, setAddAthletes } =
    useBuilderManagerQuery();

  const assignAthlete = useAssignAthlete({ suppressErrorToast: true });

  const [showAddGroup, setShowAddGroup] = React.useState(false);
  const [addAthletesOpen, setAddAthletesOpen] = React.useState(false);
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
      setAddAthletesOpen(false);
      setSettingsOpen(false);
    }
  }, [readOnly]);

  React.useEffect(() => {
    if (addAthletes && !readOnly) {
      setAddAthletesOpen(true);
      void setAddAthletes(null);
    }
  }, [addAthletes, readOnly, setAddAthletes]);

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
    void toast.promise(
      assignAthlete.mutateAsync({
        groupId: targetGroupId,
        tournamentAthleteId: athleteId,
      }),
      {
        loading: 'Adding to group…',
        success: 'Added to group',
        error: (err) =>
          err instanceof Error ? err.message : 'Could not add athlete',
      }
    );
  };

  const handleOpenSettings = (group: GroupData) => {
    setSettingsGroup(group);
    setSettingsOpen(true);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full min-h-0 w-full">
        <AthletePool
          tournamentId={tournamentId}
          selectedGroupId={selectedGroupId}
          readOnly={readOnly}
          onOpenAddAthletes={() => setAddAthletesOpen(true)}
        />
        <GroupRosterTable
          group={selectedGroup}
          tournamentId={tournamentId}
          groups={groups}
          readOnly={readOnly}
          onOpenSettings={handleOpenSettings}
        />
        <GroupsRail
          groups={groups}
          selectedGroupId={selectedGroupId}
          readOnly={readOnly}
          onSelect={(id) => void setSelectedGroup(id)}
          onAdd={() => setShowAddGroup(true)}
          onOpenSettings={handleOpenSettings}
        />
      </div>

      <AddAthletesSheet
        open={addAthletesOpen}
        onOpenChange={setAddAthletesOpen}
        tournamentId={tournamentId}
        tournamentName={tournamentName}
        readOnly={readOnly}
      />
      <AddGroupDialog
        open={showAddGroup}
        onOpenChange={setShowAddGroup}
        tournamentId={tournamentId}
      />
      <GroupSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        group={settingsGroup}
      />
    </DndContext>
  );
}
