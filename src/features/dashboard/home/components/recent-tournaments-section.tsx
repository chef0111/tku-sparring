import { HubSection, HubSectionBody } from './hub-panel';
import type { TournamentListItem } from '@/features/dashboard/types';
import type { DataTableRowAction } from '@/types/data-table';
import { useRecentTournamentsTable } from '@/features/dashboard/home/hooks/use-recent-tournaments-table';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';

interface RecentTournamentsSectionProps {
  tournaments: Array<TournamentListItem>;
  pending: boolean;
  onRowAction: (action: DataTableRowAction<TournamentListItem>) => void;
}

export function RecentTournamentsSection({
  tournaments,
  pending,
  onRowAction,
}: RecentTournamentsSectionProps) {
  const { table, tableState } = useRecentTournamentsTable(
    tournaments,
    onRowAction
  );

  return (
    <HubSection title="Recent tournaments">
      <HubSectionBody className="p-0 pt-0">
        {pending ? (
          <DataTableSkeleton
            columnCount={6}
            rowCount={3}
            withViewOptions={false}
            withPagination={false}
          />
        ) : (
          <DataTable
            table={table}
            state={tableState}
            selectedRows={false}
            pagination={false}
            className="gap-0"
          />
        )}
      </HubSectionBody>
    </HubSection>
  );
}
