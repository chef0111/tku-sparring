import {
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import * as React from 'react';
import type {
  ColumnFiltersState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  TableOptions,
  TableState,
  Updater,
  VisibilityState,
} from '@tanstack/react-table';
import type { SingleParser, UseQueryStateOptions } from 'nuqs';

import type { ExtendedColumnSort, QueryKeys } from '@/types/data-table';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { getSortingStateParser } from '@/lib/data-table/parsers';

const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'perPage';
const SORT_KEY = 'sort';
const FILTERS_KEY = 'filters';
const JOIN_OPERATOR_KEY = 'joinOperator';
const ARRAY_SEPARATOR = ',';
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface UseDataTableProps<TData>
  extends
    Omit<
      TableOptions<TData>,
      | 'state'
      | 'pageCount'
      | 'getCoreRowModel'
      | 'manualFiltering'
      | 'manualPagination'
      | 'manualSorting'
    >,
    Required<Pick<TableOptions<TData>, 'pageCount'>> {
  initialState?: Omit<Partial<TableState>, 'sorting'> & {
    sorting?: Array<ExtendedColumnSort<TData>>;
  };
  queryKeys?: Partial<QueryKeys>;
  filterQueryKeys?: Partial<Record<string, string>>;
  history?: 'push' | 'replace';
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
}

export interface DataTableControlledState {
  pagination: PaginationState;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  columnFilters: ColumnFiltersState;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    queryKeys,
    filterQueryKeys,
    history = 'replace',
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    ...tableProps
  } = props;
  const pageKey = queryKeys?.page ?? PAGE_KEY;
  const perPageKey = queryKeys?.perPage ?? PER_PAGE_KEY;
  const sortKey = queryKeys?.sort ?? SORT_KEY;
  const filtersKey = queryKeys?.filters ?? FILTERS_KEY;
  const joinOperatorKey = queryKeys?.joinOperator ?? JOIN_OPERATOR_KEY;

  const queryStateOptions = React.useMemo<
    Omit<UseQueryStateOptions<string>, 'parse'>
  >(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    ]
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const [page, setPage] = useQueryState(
    pageKey,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1)
  );
  const [perPage, setPerPage] = useQueryState(
    perPageKey,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10)
  );

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === 'function') {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage]
  );

  const columnIds = React.useMemo(() => {
    return new Set(
      columns.map((column) => column.id).filter(Boolean) as Array<string>
    );
  }, [columns]);

  const [sorting, setSorting] = useQueryState(
    sortKey,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? [])
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterKeyByColumnId = React.useMemo(() => {
    return filterableColumns.reduce<Record<string, string>>((acc, column) => {
      if (!column.id) return acc;
      acc[column.id] = filterQueryKeys?.[column.id] ?? column.id;
      return acc;
    }, {});
  }, [filterableColumns, filterQueryKeys]);

  const columnIdByFilterKey = React.useMemo(() => {
    return Object.entries(filterKeyByColumnId).reduce<Record<string, string>>(
      (acc, [columnId, filterKey]) => {
        acc[filterKey] = columnId;
        return acc;
      },
      {}
    );
  }, [filterKeyByColumnId]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<
      Record<string, SingleParser<string> | SingleParser<Array<string>>>
    >((acc, column) => {
      const filterKey = filterKeyByColumnId[column.id ?? ''] ?? column.id ?? '';
      if (!filterKey) return acc;

      if (column.meta?.options) {
        acc[filterKey] = parseAsArrayOf(
          parseAsString,
          ARRAY_SEPARATOR
        ).withOptions(queryStateOptions);
      } else {
        acc[filterKey] = parseAsString.withOptions(queryStateOptions);
      }
      return acc;
    }, {});
  }, [
    filterableColumns,
    filterKeyByColumnId,
    queryStateOptions,
    enableAdvancedFilter,
  ]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: typeof filterValues) => {
      void setPage(1);
      void setFilterValues(values);
    },
    debounceMs
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        const columnId = columnIdByFilterKey[key] ?? key;
        if (
          value !== null &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          filters.push({
            id: columnId,
            value,
          });
        }
        return filters;
      },
      []
    );
  }, [filterValues, columnIdByFilterKey, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | Array<string> | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            const filterKey = filterKeyByColumnId[filter.id] ?? filter.id;
            const value = filter.value as string | Array<string>;
            acc[filterKey] =
              value === '' || (Array.isArray(value) && value.length === 0)
                ? null
                : value;
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            const filterKey =
              filterKeyByColumnId[prevFilter.id] ?? prevFilter.id;
            filterUpdates[filterKey] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [
      debouncedSetFilterValues,
      filterableColumns,
      filterKeyByColumnId,
      enableAdvancedFilter,
    ]
  );

  const onRowSelectionChange = React.useCallback(
    (updaterOrValue: Updater<RowSelectionState>) => {
      setRowSelection((prev) => {
        const next =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue;

        return next;
      });
    },
    []
  );

  const onColumnVisibilityChange = React.useCallback(
    (updaterOrValue: Updater<VisibilityState>) => {
      setColumnVisibility((prev) => {
        const next =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(prev)
            : updaterOrValue;

        return next;
      });
    },
    []
  );

  const onSortingChangeWithLog = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const next =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(sorting)
          : updaterOrValue;

      void setSorting(next as Array<ExtendedColumnSort<TData>>);
    },
    [setSorting, sorting]
  );

  const tableState = React.useMemo<DataTableControlledState>(
    () => ({
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    }),
    [pagination, sorting, columnVisibility, rowSelection, columnFilters]
  );

  const getRowId = React.useCallback(
    (row: TData, index: number, parent?: Row<TData>) => {
      if (tableProps.getRowId) return tableProps.getRowId(row, index, parent);

      const rowWithId = row as { id?: string | number };
      return rowWithId.id != null ? String(rowWithId.id) : String(index);
    },
    [tableProps.getRowId]
  );

  React.useEffect(() => {
    const currentRowIds = new Set(
      tableProps.data.map((row, index) => getRowId(row, index))
    );

    setRowSelection((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([rowId]) => currentRowIds.has(rowId))
      );

      return Object.keys(next).length === Object.keys(prev).length
        ? prev
        : next;
    });
  }, [tableProps.data, getRowId]);

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: tableState,
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    getRowId,
    enableRowSelection: true,
    onRowSelectionChange,
    onPaginationChange,
    onSortingChange: onSortingChangeWithLog,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    meta: {
      ...tableProps.meta,
      queryKeys: {
        page: pageKey,
        perPage: perPageKey,
        sort: sortKey,
        filters: filtersKey,
        joinOperator: joinOperatorKey,
      },
    },
  });

  return React.useMemo(
    () => ({ table, state: tableState, shallow, debounceMs, throttleMs }),
    [table, tableState, shallow, debounceMs, throttleMs]
  );
}
