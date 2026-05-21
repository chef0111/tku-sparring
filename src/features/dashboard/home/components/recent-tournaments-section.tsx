import * as React from 'react';
import { HubSection, HubSectionBody } from './hub-panel';
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
    <HubSection title="Recent tournaments">
      <HubSectionBody className="p-0 pt-0">
        <DataTable
          table={table}
          state={tableState}
          selectedRows={false}
          pagination={false}
          className="gap-0"
        />
      </HubSectionBody>
    </HubSection>
  );
}
