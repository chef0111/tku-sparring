import type { ColumnDef } from '@tanstack/react-table';
import type {
  TournamentListItem,
  TournamentSortField,
  TournamentStatus,
} from '@/features/dashboard/types';
import type { TournamentsManagerQuery } from '../../hooks/use-tournaments-manager-query';

import { useTournamentList } from '@/queries/tournaments';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';

interface TournamentsTableProps {
  columns: Array<ColumnDef<TournamentListItem>>;
  query: TournamentsManagerQuery;
  className?: string;
}

export function TournamentsTable({
  columns,
  query,
  className,
}: TournamentsTableProps) {
  const { isFetching, isPending, data } = useTournamentList({
    page: query.page,
    perPage: query.perPage,
    query: query.queryFilter ?? undefined,
    name: query.nameFilter ?? undefined,
    status:
      query.statusFilter && query.statusFilter.length > 0
        ? (query.statusFilter as Array<TournamentStatus>)
        : undefined,
    sort: query.sort?.[0]?.id as TournamentSortField,
    sortDir: query.sort?.[0]?.desc ? 'desc' : 'asc',
  });

  const { table, state: tableState } = useDataTable({
    data: (data?.items ?? []) as Array<TournamentListItem>,
    columns,
    pageCount: Math.max(1, Math.ceil((data?.total ?? 0) / query.perPage)),
    filteredRowCount: data?.total,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    shallow: true,
    clearOnDefault: true,
  });

  if (isPending && !data) {
    return (
      <div className={cn('flex-1 overflow-auto', className)}>
        <DataTableSkeleton
          columnCount={6}
          withViewOptions={false}
          rowCount={10}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-auto', className)}>
      {isFetching && !data ? (
        <DataTableSkeleton columnCount={6} rowCount={10} />
      ) : (
        <DataTable table={table} state={tableState} selectedRows={false} />
      )}
    </div>
  );
}
