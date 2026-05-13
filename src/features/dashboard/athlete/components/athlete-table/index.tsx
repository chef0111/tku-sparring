import * as React from 'react';
import { Download, Upload } from 'lucide-react';

import { BulkAddAthletesDialog } from '../dialogs/bulk-add-athletes-dialog';
import { BulkDeleteAthletesDialog } from '../dialogs/bulk-delete-athletes-dialog';
import { useAthleteTableQuery } from '../../hooks/use-athlete-manager-query';
import { AthletesActionBar } from './athletes-action-bar';
import type { ColumnDef } from '@tanstack/react-table';
import type { AthleteProfileData } from '@/features/dashboard/types';

import type { AthleteProfilesDTO } from '@/orpc/athlete-profiles/dto';
import { useAthleteProfiles } from '@/queries/athlete-profiles';
import { useFeatureFlags } from '@/contexts/feature-flags';
import { useDataTable } from '@/hooks/use-data-table';
import { exportTableToCSV } from '@/lib/data-table/export';
import { DEFAULT_SORTING } from '@/config/athlete';
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
  const [bulkAddAthleteIds, setBulkAddAthleteIds] = React.useState<
    Array<string>
  >([]);
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
    gender:
      query.genderFilter && query.genderFilter.length > 0
        ? (query.genderFilter as Array<'M' | 'F'>)
        : undefined,
    affiliation: query.affiliationFilter ?? undefined,
    beltLevels: query.beltLevels,
    weightMin: query.weightRange?.[0],
    weightMax: query.weightRange?.[1],
    sorting: query.sort as AthleteProfilesDTO['sorting'],
    filterFlag: filterFlag ?? undefined,
    filters: query.filters,
    joinOperator: query.joinOperator,
  });

  const tableData = data?.items ?? [];

  const {
    table,
    state: tableState,
    shallow,
    debounceMs,
    throttleMs,
  } = useDataTable({
    data: tableData,
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / query.perPage),
    filteredRowCount: data?.total,
    initialState: {
      sorting: DEFAULT_SORTING,
      columnPinning: { right: ['actions'] },
    },
    shallow: true,
    clearOnDefault: true,
    filterQueryKeys: enableQueryFilter ? { name: 'query' } : {},
  });

  function handleBulkAddToTournament() {
    setBulkAddAthleteIds(
      table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)
    );
    setBulkAddOpen(true);
  }

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
          <DataTableSkeleton columnCount={7} filterCount={4} rowCount={10} />
        ) : (
          <DataTable
            table={table}
            state={tableState}
            actionBar={
              <AthletesActionBar
                table={table}
                state={tableState}
                onBulkAdd={handleBulkAddToTournament}
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
      <BulkAddAthletesDialog
        open={bulkAddOpen}
        onOpenChange={(open) => {
          setBulkAddOpen(open);
          if (!open) setBulkAddAthleteIds([]);
        }}
        athleteProfileIds={bulkAddAthleteIds}
        onSuccess={() => {
          table.resetRowSelection();
          setBulkAddAthleteIds([]);
        }}
      />
    </>
  );
}
