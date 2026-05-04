import { flexRender } from '@tanstack/react-table';
import * as React from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';

import type { DataTableControlledState } from '@/hooks/use-data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getColumnPinningStyle } from '@/lib/data-table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  state: DataTableControlledState;
  actionBar?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  state,
  actionBar,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const selectedRowCount = Object.keys(state.rowSelection).length;
  const renderedRows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const renderedHeaders = React.useMemo(
    () =>
      table
        .getFlatHeaders()
        .filter(
          (header) =>
            !header.isPlaceholder &&
            state.columnVisibility[header.column.id] !== false
        ),
    [table, state.columnVisibility]
  );

  return (
    <div
      className={cn('flex w-full flex-col gap-2.5 overflow-auto', className)}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {renderedHeaders.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    ...getColumnPinningStyle({ column: header.column }),
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderedRows?.length ? (
              renderedRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...getColumnPinningStyle({ column: cell.column }),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} state={state} />
        {actionBar && selectedRowCount > 0 && actionBar}
      </div>
    </div>
  );
}
