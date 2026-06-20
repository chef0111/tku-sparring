import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import type { DivisionData } from '@/contracts/tournament/division';
import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/dto';
import { getDivisionRosterColumns } from '@/features/dashboard/components/tournament/builder/divisions-tab/division-roster-table/division-roster-columns';
import { getViolations } from '@/features/dashboard/components/tournament/builder/divisions-tab/division-violation-badge';
import { useTournamentAthletes } from '@/queries/tournament-athlete';
import { useAssignAthlete, useUnassignAthlete } from '@/queries/division';

export interface UseDivisionRosterTableArgs {
  division: DivisionData;
  tournamentId: string;
  divisions: Array<DivisionData>;
  readOnly: boolean;
}

export function useDivisionRosterTable({
  division,
  tournamentId,
  divisions,
  readOnly,
}: UseDivisionRosterTableArgs) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  React.useEffect(() => {
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
  }, [division.id]);

  const sortingInput = sorting.map((s) => ({
    id: s.id as 'name' | 'gender' | 'beltLevel' | 'weight' | 'createdAt',
    desc: s.desc,
  })) as ListTournamentAthletesDTO['sorting'];

  const { data, isPending } = useTournamentAthletes({
    tournamentId,
    divisionId: division.id,
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

  const divisionRef = React.useRef(division);
  divisionRef.current = division;

  const otherDivisions = React.useMemo(
    () => divisions.filter((d) => d.id !== division.id),
    [divisions, division.id]
  );
  const otherDivisionsRef = React.useRef<Array<DivisionData>>([]);
  otherDivisionsRef.current = otherDivisions;
  const otherDivisionsKey = otherDivisions.map((d) => d.id).join(',');

  const columns = React.useMemo(
    () =>
      getDivisionRosterColumns({
        division: divisionRef.current,
        readOnly,
        otherDivisions: otherDivisionsRef.current,
        onUnassign: (athleteId) => {
          void toast.promise(
            unassignMutateAsyncRef.current({
              tournamentAthleteId: athleteId,
            }),
            {
              loading: 'Removing from division…',
              success: 'Moved to unassigned',
              error: (err) =>
                err instanceof Error ? err.message : 'Could not unassign',
            }
          );
        },
        onMove: (athleteId, targetDivisionId) => {
          void toast.promise(
            assignMutateAsyncRef.current({
              divisionId: targetDivisionId,
              tournamentAthleteId: athleteId,
            }),
            {
              loading: 'Moving athlete…',
              success: 'Moved to division',
              error: (err) =>
                err instanceof Error ? err.message : 'Move failed',
            }
          );
        },
      }),
    [division.id, readOnly, otherDivisionsKey]
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
    (a) => getViolations(a, division).length > 0
  ).length;

  const { setNodeRef, isOver } = useDroppable({
    id: `roster:${division.id}`,
    data: { divisionId: division.id },
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
