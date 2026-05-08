import * as React from 'react';
import { Download, Upload } from 'lucide-react';

import { BulkAddToTournamentDialog } from '../dialogs/bulk-add-to-tournament-dialog';
import { BulkDeleteAthletesDialog } from '../dialogs/bulk-delete-athletes-dialog';
import { useAthleteTableQuery } from '../../hooks/use-athlete-manager-query';
import { AthletesActionBar } from './athletes-action-bar';
import type { ColumnDef } from '@tanstack/react-table';
import type { AthleteProfileData } from '@/features/dashboard/types';

import { useAthleteProfiles } from '@/queries/athlete-profiles';
import { useFeatureFlags } from '@/contexts/feature-flags';
import { useDataTable } from '@/hooks/use-data-table';
import { exportTableToCSV } from '@/lib/data-table/export';
import { cn } from '@/lib/utils';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';

interface AthleteTableProps {
  columns: Array<ColumnDef<AthleteProfileData>>;
  className?: string;
  onAdd: () => void;
  onImport: () => void;
  enableQueryFilter?: boolean;
}

export function AthleteTable({
  columns,
  className,
  onAdd,
  onImport,
  enableQueryFilter = true,
}: AthleteTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const query = useAthleteTableQuery();

  const [bulkAddOpen, setBulkAddOpen] = React.useState(false);
  const [bulkDeleteAthletes, setBulkDeleteAthletes] = React.useState<Array<{
    id: string;
    name: string;
  }> | null>(null);

  const { data, isFetching } = useAthleteProfiles({
    page: query.page,
    perPage: query.perPage,
    query: enableQueryFilter ? (query.queryFilter ?? undefined) : undefined,
    athleteCode: query.athleteCodeFilter ?? undefined,
    name: query.nameFilter ?? undefined,
    gender: (query.genderFilter?.[0] as 'M' | 'F') ?? undefined,
    affiliation: query.affiliationFilter ?? undefined,
    beltLevelMin: query.beltRange?.[0],
    beltLevelMax: query.beltRange?.[1],
    weightMin: query.weightRange?.[0],
    weightMax: query.weightRange?.[1],
    sort: query.sort?.[0]?.id ?? undefined,
    sortDir: query.sort?.[0]?.desc ? 'desc' : 'asc',
    filterFlag: filterFlag ?? undefined,
    filters: query.filters,
    joinOperator: query.joinOperator,
  });

  const {
    table,
    state: tableState,
    shallow,
    debounceMs,
    throttleMs,
  } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / query.perPage),
    shallow: true,
    clearOnDefault: true,
    filterQueryKeys: enableQueryFilter ? { name: 'query' } : {},
  });

  const currentItemIds = React.useMemo(
    () => new Set((data?.items ?? []).map((athlete) => athlete.id)),
    [data?.items]
  );
  const selectedIds = React.useMemo(
    () =>
      Object.keys(tableState.rowSelection).filter((id) =>
        currentItemIds.has(id)
      ),
    [tableState.rowSelection, currentItemIds]
  );

  function handleBulkDeleteClick() {
    const rows = table.getFilteredSelectedRowModel().rows;
    setBulkDeleteAthletes(
      rows.map((row) => ({
        id: row.original.id,
        name: row.original.name,
      }))
    );
  }

  function handleExportAll() {
    exportTableToCSV(table, {
      filename: 'athletes',
      excludeColumns: ['select', 'actions'],
      headers: {
        athleteCode: 'Athlete ID',
        name: 'Name',
        gender: 'Gender',
        beltLevel: 'Belt level',
        weight: 'Weight',
        affiliation: 'Affiliation',
      },
    });
  }

  return (
    <>
      <div className={cn('flex-1 overflow-auto', className)}>
        {isFetching && !data ? (
          <DataTableSkeleton columnCount={7} rowCount={10} />
        ) : (
          <DataTable
            table={table}
            state={tableState}
            actionBar={
              <AthletesActionBar
                table={table}
                onBulkAdd={() => setBulkAddOpen(true)}
                onDelete={handleBulkDeleteClick}
              />
            }
            addRow={{
              label: 'Add athlete',
              onClick: onAdd,
            }}
          >
            {enableAdvancedFilter ? (
              <DataTableAdvancedToolbar table={table} state={tableState}>
                <DataTableSortList
                  table={table}
                  state={tableState}
                  align="start"
                />
                {filterFlag === 'advancedFilters' ? (
                  <DataTableFilterList
                    table={table}
                    shallow={shallow}
                    debounceMs={debounceMs}
                    throttleMs={throttleMs}
                    align="start"
                  />
                ) : (
                  <DataTableFilterMenu
                    table={table}
                    shallow={shallow}
                    debounceMs={debounceMs}
                    throttleMs={throttleMs}
                    align="start"
                  />
                )}
              </DataTableAdvancedToolbar>
            ) : (
              <DataTableToolbar table={table} state={tableState}>
                <Button variant="outline" size="sm" onClick={onImport}>
                  <Upload className="mr-1 size-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportAll}>
                  <Download className="mr-1 size-4" />
                  Export
                </Button>
                <DataTableSortList
                  table={table}
                  state={tableState}
                  align="end"
                />
              </DataTableToolbar>
            )}
          </DataTable>
        )}
      </div>

      <BulkDeleteAthletesDialog
        athletes={bulkDeleteAthletes}
        onClose={() => setBulkDeleteAthletes(null)}
        onSuccess={() => table.resetRowSelection()}
      />
      <BulkAddToTournamentDialog
        open={bulkAddOpen}
        onOpenChange={setBulkAddOpen}
        athleteProfileIds={selectedIds}
        onSuccess={() => table.resetRowSelection()}
      />
    </>
  );
}
