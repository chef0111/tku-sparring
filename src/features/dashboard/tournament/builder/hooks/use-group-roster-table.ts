import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import type { GroupData } from '@/features/dashboard/types';
import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/dto';
import { getViolations } from '@/features/dashboard/tournament/builder/components/groups-tab/out-of-range-badge';
import { getGroupRosterColumns } from '@/features/dashboard/tournament/builder/components/groups-tab/group-roster-table/group-roster-columns';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import { useAssignAthlete, useUnassignAthlete } from '@/queries/groups';

export interface UseGroupRosterTableArgs {
  group: GroupData;
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
}

export function useGroupRosterTable({
  group,
  tournamentId,
  groups,
  readOnly,
}: UseGroupRosterTableArgs) {
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

  const { data, isPending } = useTournamentAthletes({
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

  const otherGroups = React.useMemo(
    () => groups.filter((g) => g.id !== group.id),
    [groups, group.id]
  );
  const otherGroupsRef = React.useRef<Array<GroupData>>([]);
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
      filteredRowCount: total,
    }),
    [pagination, sorting, total]
  );

  const table = useReactTable({
    data: items,
    columns,
    rowCount: total,
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

  const showRosterSkeleton = isPending && !data;

  return {
    table,
    tableState,
    columns,
    data,
    showRosterSkeleton,
    items,
    total,
    violationCount,
    setNodeRef,
    isOver,
  };
}
