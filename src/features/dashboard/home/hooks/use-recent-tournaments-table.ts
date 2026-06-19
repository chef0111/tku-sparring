import * as React from 'react';
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { SortingState, VisibilityState } from '@tanstack/react-table';
import type { DataTableControlledState } from '@/hooks/use-data-table';
import type {
  TournamentListItem,
  TournamentRowActionOptions,
} from '@/features/dashboard/types';
import { getTournamentsTableColumns } from '@/features/dashboard/tournament/components/overview/tournaments-table/tournaments-table-columns';

export function useRecentTournamentsTable(
  tournaments: Array<TournamentListItem>,
  onRowAction: TournamentRowActionOptions['onRowAction']
) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const tournamentById = React.useMemo(
    () => new Map(tournaments.map((t) => [t.id, t])),
    [tournaments]
  );

  const resolveTournament = React.useCallback(
    (id: string) => tournamentById.get(id),
    [tournamentById]
  );

  const columns = React.useMemo(
    () => getTournamentsTableColumns({ onRowAction, resolveTournament }),
    [onRowAction, resolveTournament]
  );

  const pageSize = Math.max(tournaments.length, 1);

  const tableState = React.useMemo<DataTableControlledState>(
    () => ({
      pagination: { pageIndex: 0, pageSize },
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: [],
      filteredRowCount: tournaments.length,
    }),
    [pageSize, sorting, columnVisibility, rowSelection, tournaments.length]
  );

  const table = useReactTable({
    data: tournaments,
    columns,
    state: {
      ...tableState,
      columnPinning: { right: ['actions'] },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: false,
  });

  return { table, tableState: table.getState() };
}
