import * as React from 'react';
import type { TournamentListItem } from '@/features/dashboard/types';
import type { DataTableRowAction } from '@/types/data-table';
import { getTournamentsTableColumns } from '@/features/dashboard/tournament/list/components/tournaments-table/tournaments-table-columns';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTable } from '@/components/data-table/data-table';

interface RecentTournamentsSectionProps {
  tournaments: Array<TournamentListItem>;
  onRowAction: (action: DataTableRowAction<TournamentListItem>) => void;
}

export function RecentTournamentsSection({
  tournaments,
  onRowAction,
}: RecentTournamentsSectionProps) {
  const columns = React.useMemo(
    () => getTournamentsTableColumns({ onRowAction }),
    [onRowAction]
  );

  const { table, state: tableState } = useDataTable({
    data: tournaments,
    columns,
    pageCount: 1,
    filteredRowCount: tournaments.length,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    shallow: true,
    clearOnDefault: true,
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Recent tournaments
      </h2>
      <DataTable
        table={table}
        state={tableState}
        selectedRows={false}
        pagination={false}
      />
    </section>
  );
}
