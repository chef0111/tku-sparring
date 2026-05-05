import { flexRender } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import * as React from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';

import type { DataTableControlledState } from '@/hooks/use-data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
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
  addRow?: {
    label?: string;
    onClick: () => void;
  };
}

export function DataTable<TData>({
  table,
  state,
  actionBar,
  addRow,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const selectedRowCount = Object.keys(state.rowSelection).length;
  const renderedRows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const renderedHeaders = table
    .getFlatHeaders()
    .filter(
      (header) =>
        !header.isPlaceholder &&
        state.columnVisibility[header.column.id] !== false
    );

  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders();
    return Object.fromEntries(
      headers.map((header) => [
        `--col-${header.column.id}-size`,
        `${header.getSize()}px`,
      ])
    );
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  return (
    <div
      className={cn('flex w-full flex-col gap-2.5 overflow-auto', className)}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md border">
        <Table
          style={{
            ...columnSizeVars,
          }}
        >
          <TableHeader>
            <TableRow>
              {renderedHeaders.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    ...getColumnPinningStyle({ column: header.column }),
                    width: `var(--col-${header.column.id}-size)`,
                  }}
                  className="relative border-x select-none"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        header.getResizeHandler()(e);
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        header.getResizeHandler()(e);
                      }}
                      className={cn(
                        'absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none',
                        'bg-border opacity-0 transition-opacity',
                        'hover:opacity-100',
                        header.column.getIsResizing() &&
                          'bg-primary opacity-100'
                      )}
                    />
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
            {addRow && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumnCount} className="p-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addRow.onClick}
                    className="text-muted-foreground hover:text-foreground h-12 w-full gap-1.5 rounded-t-none"
                  >
                    <PlusIcon />
                    {addRow.label ?? 'Add row'}
                  </Button>
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
