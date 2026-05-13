import * as React from 'react';
import { Settings } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { toast } from 'sonner';
import { GroupViolationCountBadge, getViolations } from '../out-of-range-badge';
import { getGroupRosterColumns } from './group-roster-columns';
import { GroupRosterEmptyState } from './group-roster-empty-state';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import type { GroupData } from '@/features/dashboard/types';
import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/tournament-athletes.dto';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { DataTable } from '@/components/data-table/data-table';
import { getBeltLabel } from '@/config/athlete';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import { useAssignAthlete, useUnassignAthlete } from '@/queries/groups';
import { cn } from '@/lib/utils';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';

type LeaseStatus =
  | 'available'
  | 'held_by_me'
  | 'held_by_other'
  | 'pending_takeover';

interface LeaseInfo {
  leaseStatus: LeaseStatus;
}

interface GroupRosterTableProps {
  group: GroupData | null;
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  leaseInfo?: LeaseInfo;
  onOpenSettings: (group: GroupData) => void;
  onRequestTakeover: (groupId: string) => void;
}

function leaseToStatusVariant(
  status?: LeaseStatus
): 'online' | 'offline' | 'degraded' | 'maintenance' {
  switch (status) {
    case 'held_by_me':
    case 'available':
      return 'online';
    case 'held_by_other':
      return 'degraded';
    case 'pending_takeover':
      return 'maintenance';
    default:
      return 'online';
  }
}

function leaseLabel(status?: LeaseStatus): string {
  switch (status) {
    case 'held_by_me':
      return 'You';
    case 'held_by_other':
      return 'Locked';
    case 'pending_takeover':
      return 'Pending';
    default:
      return 'Free';
  }
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
    <ActiveGroupRoster
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

interface ActiveGroupRosterProps extends Omit<GroupRosterTableProps, 'group'> {
  group: GroupData;
}

function ActiveGroupRoster({
  group,
  tournamentId,
  groups,
  readOnly,
  leaseInfo,
  onOpenSettings,
  onRequestTakeover,
}: ActiveGroupRosterProps) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  React.useEffect(() => {
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
  }, [group.id]);

  const sortingInput = sorting.map((s) => ({
    id: s.id as 'name' | 'gender' | 'beltLevel' | 'weight' | 'createdAt',
    desc: s.desc,
  })) as ListTournamentAthletesDTO['sorting'];

  const { data, isFetching } = useTournamentAthletes({
    tournamentId,
    groupId: group.id,
    unassignedOnly: false,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    sorting: sortingInput,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const unassign = useUnassignAthlete({ suppressErrorToast: true });
  const assign = useAssignAthlete({ suppressErrorToast: true });

  const unassignMutateAsyncRef = React.useRef(unassign.mutateAsync);
  unassignMutateAsyncRef.current = unassign.mutateAsync;
  const assignMutateAsyncRef = React.useRef(assign.mutateAsync);
  assignMutateAsyncRef.current = assign.mutateAsync;

  const groupRef = React.useRef(group);
  groupRef.current = group;
  const otherGroupsRef = React.useRef<Array<GroupData>>([]);

  const otherGroups = React.useMemo(
    () => groups.filter((g) => g.id !== group.id),
    [groups, group.id]
  );
  otherGroupsRef.current = otherGroups;
  const otherGroupsKey = otherGroups.map((g) => g.id).join(',');

  const columns = React.useMemo(
    () =>
      getGroupRosterColumns({
        group: groupRef.current,
        readOnly,
        otherGroups: otherGroupsRef.current,
        onUnassign: (athleteId) => {
          void toast.promise(
            unassignMutateAsyncRef.current({
              tournamentAthleteId: athleteId,
            }),
            {
              loading: 'Removing from group…',
              success: 'Moved to unassigned',
              error: (err) =>
                err instanceof Error ? err.message : 'Could not unassign',
            }
          );
        },
        onMove: (athleteId, targetGroupId) => {
          void toast.promise(
            assignMutateAsyncRef.current({
              groupId: targetGroupId,
              tournamentAthleteId: athleteId,
            }),
            {
              loading: 'Moving athlete…',
              success: 'Moved to group',
              error: (err) =>
                err instanceof Error ? err.message : 'Move failed',
            }
          );
        },
      }),
    [group.id, readOnly, otherGroupsKey]
  );

  const tableState = React.useMemo(
    () => ({
      pagination,
      sorting,
      columnVisibility: {},
      rowSelection: {},
      columnFilters: [],
    }),
    [pagination, sorting]
  );

  const table = useReactTable({
    data: items,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize) || 1,
    manualPagination: true,
    manualSorting: true,
    state: tableState,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });

  const violationCount = items.filter(
    (a) => getViolations(a, group).length > 0
  ).length;

  const { setNodeRef, isOver } = useDroppable({
    id: `roster:${group.id}`,
    data: { groupId: group.id },
  });

  const statusVariant = leaseToStatusVariant(leaseInfo?.leaseStatus);

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
          <GroupViolationCountBadge count={violationCount} />

          <div className="ml-auto flex items-center gap-2">
            <Status status={statusVariant} className="h-6 px-1.5">
              <StatusIndicator />
              <StatusLabel>{leaseLabel(leaseInfo?.leaseStatus)}</StatusLabel>
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
          {group._count.tournamentAthletes === 1 ? '' : 's'} · {violationCount}{' '}
          violation{violationCount === 1 ? '' : 's'} · Arena {group.arenaIndex}
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={cn('flex-1 overflow-auto p-4', isOver && 'bg-primary/5')}
      >
        {isFetching && !data ? (
          <DataTableSkeleton
            columnCount={columns.length}
            withViewOptions={false}
            withPagination={false}
            rowCount={10}
          />
        ) : total === 0 ? (
          <GroupRosterEmptyState
            variant="no-athletes"
            group={group}
            tournamentId={tournamentId}
            readOnly={readOnly}
          />
        ) : (
          <DataTable table={table} state={tableState} selectedRows={false} />
        )}
      </div>
    </div>
  );
}
