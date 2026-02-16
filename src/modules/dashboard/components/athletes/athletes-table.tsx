import * as React from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';

import { AddAthleteDrawer } from './add-athlete-drawer';
import type { DragEndEvent } from '@dnd-kit/core';
import type { AthleteDTO } from '@/orpc/athletes/athletes.dto';
import type { DataTableRowAction } from '@/types/data-table';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { useFeatureFlags } from '@/contexts/feature-flags/use-feature-flags';
import { useDataTable } from '@/hooks/use-data-table';
import { getValidFilters } from '@/lib/data-table';
import { getFiltersStateParser, getSortingStateParser } from '@/lib/parsers';
import { getAthleteColumns } from '@/modules/dashboard/components/athletes/athlete-columns';
import { Header } from '@/modules/dashboard/header';
import { useAllAthletes, useReorderAthletes } from '@/queries/athletes';

const basicFilterParsers = {
  code: parseAsString,
  name: parseAsString,
  beltLevel: parseAsArrayOf(parseAsString, ','),
  weight: parseAsString,
  affiliation: parseAsString,
};

export function AthletesTable() {
  const { filterFlag, enableAdvancedFilter } = useFeatureFlags();

  // Pagination & sorting from URL
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [sort] = useQueryState(
    'sort',
    getSortingStateParser<AthleteDTO>().withDefault([])
  );

  // Advanced mode filters (JSON format: ?filters=[{...}])
  const [advancedFilters] = useQueryState(
    'filters',
    getFiltersStateParser<AthleteDTO>().withDefault([])
  );

  const [basicFilterValues] = useQueryStates(basicFilterParsers);

  const apiFilters = React.useMemo(() => {
    if (enableAdvancedFilter) {
      return getValidFilters(advancedFilters).map((f) => ({
        id: f.id,
        value: f.value,
        variant: f.variant,
        operator: f.operator,
      }));
    }

    const filters: Array<{
      id: string;
      value: string | Array<string>;
      variant?: string;
      operator?: string;
    }> = [];

    for (const [id, value] of Object.entries(basicFilterValues)) {
      if (
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue;
      }
      filters.push({
        id,
        value,
        variant: Array.isArray(value) ? 'multiSelect' : 'text',
        operator: Array.isArray(value) ? 'inArray' : 'iLike',
      });
    }

    return filters;
  }, [enableAdvancedFilter, advancedFilters, basicFilterValues]);

  const { data, isLoading } = useAllAthletes({
    page,
    perPage,
    sort,
    filters: apiFilters,
  });
  const reorderMutation = useReorderAthletes();

  const [_rowAction, setRowAction] =
    React.useState<DataTableRowAction<AthleteDTO> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const columns = React.useMemo(
    () =>
      getAthleteColumns({
        setRowAction,
        enableDrag: true,
      }),
    []
  );

  const { table, shallow, debounceMs } = useDataTable({
    data: (data?.data ?? []) as Array<AthleteDTO>,
    columns,
    pageCount: data?.pageCount ?? -1,
    getRowId: (row) => row.id,
    enableAdvancedFilter,
  });

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const rows = table.getRowModel().rows;
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedIds = arrayMove(
          rows.map((r) => r.original.id),
          oldIndex,
          newIndex
        );
        reorderMutation.mutate({ ids: reorderedIds });
      }
    },
    [table, reorderMutation]
  );

  if (isLoading && !data) {
    return (
      <div className="flex h-full w-full flex-col">
        <Header title="Athletes" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <DataTableSkeleton
            columnCount={6}
            rowCount={10}
            withPagination
            shrinkZero
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTable
        table={table}
        enableDrag
        onDragEnd={handleDragEnd}
        getRowId={(row) => row.id}
        onRowAdd={() => setShowCreateDialog(true)}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === 'advancedFilters' ? (
              <DataTableFilterList
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
      <AddAthleteDrawer
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
