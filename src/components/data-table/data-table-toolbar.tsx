import { X } from 'lucide-react';
import * as React from 'react';
import type { Column, Table } from '@tanstack/react-table';

import type { DataTableControlledState } from '@/hooks/use-data-table';
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { DataTableSliderFilter } from '@/components/data-table/data-table-slider-filter';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  state: DataTableControlledState;
}

export function DataTableToolbar<TData>({
  table,
  state,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = state.columnFilters.length > 0;

  const columns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter());

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        'flex w-full items-start justify-between gap-2 p-1',
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter
            key={column.id}
            table={table}
            state={state}
            column={column}
          />
        ))}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
          >
            <X />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} state={state} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  table: Table<TData>;
  state: DataTableControlledState;
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  table,
  state,
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;

  if (!columnMeta?.variant) return null;

  switch (columnMeta.variant) {
    case 'text':
      return (
        <DataTableTextFilter
          table={table}
          state={state}
          column={column}
          placeholder={columnMeta.placeholder ?? columnMeta.label}
        />
      );

    case 'number':
      return (
        <DataTableTextFilter
          table={table}
          state={state}
          column={column}
          placeholder={columnMeta.placeholder ?? columnMeta.label}
          type="number"
          unit={columnMeta.unit}
        />
      );

    case 'range':
      return (
        <DataTableSliderFilter
          column={column}
          state={state}
          title={columnMeta.label ?? column.id}
        />
      );

    case 'date':
    case 'dateRange':
      return (
        <DataTableDateFilter
          column={column}
          title={columnMeta.label ?? column.id}
          multiple={columnMeta.variant === 'dateRange'}
        />
      );

    case 'select':
    case 'multiSelect':
      return (
        <DataTableFacetedFilter
          column={column}
          state={state}
          title={columnMeta.label ?? column.id}
          options={columnMeta.options ?? []}
          multiple={columnMeta.variant === 'multiSelect'}
        />
      );

    default:
      return null;
  }
}

interface DataTableTextFilterProps<TData> {
  table: Table<TData>;
  state: DataTableControlledState;
  column: Column<TData>;
  placeholder?: string;
  type?: 'text' | 'number';
  unit?: string;
}

function DataTableTextFilter<TData>({
  table,
  state,
  column,
  placeholder,
  type = 'text',
  unit,
}: DataTableTextFilterProps<TData>) {
  // Use table.getColumn() to get fresh column reference with current state
  const freshColumn = table.getColumn(column.id);
  const rawFilterValue =
    state.columnFilters.find((filter) => filter.id === column.id)?.value ??
    freshColumn?.getFilterValue();
  // Normalize: filter value can be string or array, extract string for input
  const filterValue =
    typeof rawFilterValue === 'string'
      ? rawFilterValue
      : Array.isArray(rawFilterValue)
        ? rawFilterValue.join(' ')
        : undefined;
  const [localValue, setLocalValue] = React.useState(filterValue ?? '');

  // Sync local state when filter value changes externally (e.g., URL navigation, reset)
  React.useEffect(() => {
    setLocalValue(filterValue ?? '');
  }, [filterValue]);

  const onInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      // Use fresh column reference to set filter value
      freshColumn?.setFilterValue(newValue);
    },
    [freshColumn]
  );

  if (unit) {
    return (
      <div className="relative">
        <Input
          type={type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          placeholder={placeholder}
          value={localValue}
          onChange={onInputChange}
          className={cn('h-8 w-30', 'pr-8')}
        />
        <span className="bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm">
          {unit}
        </span>
      </div>
    );
  }

  return (
    <Input
      type={type}
      inputMode={type === 'number' ? 'numeric' : undefined}
      placeholder={placeholder}
      value={localValue}
      onChange={onInputChange}
      className="h-8 w-40 lg:w-56"
    />
  );
}
