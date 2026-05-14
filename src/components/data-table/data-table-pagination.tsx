import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import type { DataTableControlledState } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DataTablePaginationProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  state: DataTableControlledState;
  pageSizeOptions?: Array<number>;
  selectedRows?: boolean;
}

export function DataTablePagination<TData>({
  table,
  state,
  pageSizeOptions = [10, 20, 30, 40, 50],
  selectedRows = true,
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const selectedRowCount = Object.keys(state.rowSelection).length;
  /** Server / manual tables must set `state.filteredRowCount` or `rowCount` on the table. */
  const filteredRowCount = state.filteredRowCount ?? table.getRowCount();

  return (
    <div
      className={cn(
        'flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8',
        className
      )}
      {...props}
    >
      {selectedRows && (
        <div className="text-muted-foreground flex-1 text-sm whitespace-nowrap">
          {selectedRowCount} of {filteredRowCount}{' '}
          {filteredRowCount === 1 ? 'row' : 'rows'} selected.
        </div>
      )}
      {filteredRowCount > state.pagination.pageSize && (
        <div className="ml-auto flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </p>
            <Select
              value={`${state.pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-18 data-size:h-8">
                <SelectValue placeholder={state.pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Page {state.pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={state.pagination.pageIndex <= 0}
            >
              <ChevronsLeft />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={state.pagination.pageIndex <= 0}
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={state.pagination.pageIndex >= table.getPageCount() - 1}
            >
              <ChevronRight />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={state.pagination.pageIndex >= table.getPageCount() - 1}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
