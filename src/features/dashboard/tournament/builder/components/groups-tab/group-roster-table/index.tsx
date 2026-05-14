import { Settings } from 'lucide-react';
import { GroupViolationCountBadge } from '../out-of-range-badge';
import { GroupRosterEmptyState } from './group-roster-empty-state';
import type { GroupData } from '@/features/dashboard/types';
import type { GroupRosterLeaseInfo } from '@/features/dashboard/tournament/builder/hooks/use-group-roster-table';
import { useGroupRosterTable } from '@/features/dashboard/tournament/builder/hooks/use-group-roster-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { DataTable } from '@/components/data-table/data-table';
import { getBeltLabel } from '@/config/athlete';
import { cn } from '@/lib/utils';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';

export type { GroupRosterLeaseInfo };

export interface GroupRosterTableProps {
  group: GroupData | null;
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  leaseInfo?: GroupRosterLeaseInfo;
  onOpenSettings: (group: GroupData) => void;
  onRequestTakeover: (groupId: string) => void;
}

export function GroupRosterTable({
  group,
  tournamentId,
  groups,
  readOnly,
  leaseInfo,
  onOpenSettings,
  onRequestTakeover,
}: GroupRosterTableProps) {
  if (!group) {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <GroupRosterEmptyState variant="no-group-selected" />
      </div>
    );
  }

  return (
    <GroupRosterActive
      group={group}
      tournamentId={tournamentId}
      groups={groups}
      readOnly={readOnly}
      leaseInfo={leaseInfo}
      onOpenSettings={onOpenSettings}
      onRequestTakeover={onRequestTakeover}
    />
  );
}

interface GroupRosterActiveProps extends Omit<GroupRosterTableProps, 'group'> {
  group: GroupData;
}

function GroupRosterActive({
  group,
  tournamentId,
  groups,
  readOnly,
  leaseInfo,
  onOpenSettings,
  onRequestTakeover,
}: GroupRosterActiveProps) {
  const roster = useGroupRosterTable({
    group,
    tournamentId,
    groups,
    readOnly,
    leaseInfo,
  });

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{group.name}</h3>
          {group.gender && (
            <Badge variant="outline" className="text-xs">
              {group.gender === 'M' ? 'Male' : 'Female'}
            </Badge>
          )}
          {(group.beltMin != null || group.beltMax != null) && (
            <Badge variant="outline" className="text-xs">
              {getBeltLabel(group.beltMin ?? 0)}–
              {getBeltLabel(group.beltMax ?? 10)}
            </Badge>
          )}
          {(group.weightMin != null || group.weightMax != null) && (
            <Badge variant="outline" className="text-xs">
              {group.weightMin ?? 20}–{group.weightMax ?? 150}kg
            </Badge>
          )}
          <GroupViolationCountBadge count={roster.violationCount} />

          <div className="ml-auto flex items-center gap-2">
            <Status status={roster.statusVariant} className="h-6 px-1.5">
              <StatusIndicator />
              <StatusLabel>{roster.leaseStatusText}</StatusLabel>
            </Status>
            {!readOnly && leaseInfo?.leaseStatus === 'held_by_other' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onRequestTakeover(group.id)}
              >
                Take over
              </Button>
            )}
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onOpenSettings(group)}
              >
                <Settings className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {group._count.tournamentAthletes} athlete
          {group._count.tournamentAthletes === 1 ? '' : 's'} ·{' '}
          {roster.violationCount} violation
          {roster.violationCount === 1 ? '' : 's'} · Arena {group.arenaIndex}
        </p>
      </div>

      <div
        ref={roster.setNodeRef}
        className={cn(
          'flex-1 overflow-auto p-4',
          roster.isOver && 'bg-primary/5'
        )}
      >
        {roster.showRosterSkeleton ? (
          <DataTableSkeleton
            columnCount={roster.columns.length}
            withViewOptions={false}
            withPagination={false}
            rowCount={10}
          />
        ) : roster.total === 0 ? (
          <GroupRosterEmptyState
            variant="no-athletes"
            group={group}
            tournamentId={tournamentId}
            readOnly={readOnly}
          />
        ) : (
          <DataTable
            table={roster.table}
            state={roster.tableState}
            selectedRows={false}
          />
        )}
      </div>
    </div>
  );
}
