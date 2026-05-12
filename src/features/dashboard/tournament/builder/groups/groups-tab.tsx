import * as React from 'react';
import { Plus } from 'lucide-react';
import { AthletePool } from './athlete-pool';
import { GroupPanel } from './group-panel';
import { GroupSettingsDrawer } from './group-settings-drawer';
import type { GroupData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { useCreateGroup } from '@/queries/groups';
import { useLeases, useRequestLeaseTakeover } from '@/queries/leases';

import { useDeviceId } from '@/hooks/use-device-id';

interface GroupsTabProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
}

export function GroupsTab({ tournamentId, groups, readOnly }: GroupsTabProps) {
  const deviceId = useDeviceId();
  const { data: leases } = useLeases(tournamentId, deviceId);
  const createGroup = useCreateGroup();
  const requestTakeover = useRequestLeaseTakeover(tournamentId);

  const [settingsGroup, setSettingsGroup] = React.useState<GroupData | null>(
    null
  );
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const leaseMap = React.useMemo(() => {
    if (!leases) return new Map();
    const map = new Map<string, (typeof leases)[number]>();
    for (const lease of leases) {
      map.set(lease.groupId, lease);
    }
    return map;
  }, [leases]);

  const handleOpenSettings = (group: GroupData) => {
    setSettingsGroup(group);
    setSettingsOpen(true);
  };

  const handleRequestTakeover = (groupId: string) => {
    if (!deviceId) return;
    requestTakeover.mutate({ groupId, deviceId });
  };

  const handleCreateGroup = () => {
    const name = `Group ${String.fromCharCode(65 + groups.length)}`;
    createGroup.mutate({ name, tournamentId });
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left panel: athlete pool */}
      <div className="bg-card flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border">
        <AthletePool
          tournamentId={tournamentId}
          groups={groups}
          readOnly={readOnly}
        />
      </div>

      {/* Right panel: groups grid */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {!readOnly && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateGroup}
              disabled={createGroup.isPending}
            >
              <Plus className="mr-1 size-3.5" />
              Add Group
            </Button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            No groups yet. Create one to get started.
          </div>
        ) : (
          <div className="grid flex-1 auto-rows-[minmax(280px,1fr)] grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <GroupPanel
                key={group.id}
                group={group}
                tournamentId={tournamentId}
                readOnly={readOnly}
                leaseInfo={leaseMap.get(group.id)}
                onOpenSettings={handleOpenSettings}
                onRequestTakeover={handleRequestTakeover}
              />
            ))}
          </div>
        )}
      </div>

      <GroupSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        group={settingsGroup}
      />
    </div>
  );
}
