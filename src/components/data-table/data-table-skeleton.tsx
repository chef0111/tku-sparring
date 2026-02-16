import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableSkeletonProps extends React.ComponentProps<'div'> {
  columnCount: number;
  rowCount?: number;
  filterCount?: number;
  cellWidths?: Array<string>;
  shrinkZero?: boolean;
  withPagination?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  filterCount = 2,
  cellWidths = ['auto'],
  shrinkZero = false,
  className,
  ...props
}: DataTableSkeletonProps) {
  return (
    <div
      className={cn('flex w-full flex-col gap-2.5 overflow-auto', className)}
      {...props}
    >
      <div className="flex w-full items-center justify-between gap-2 overflow-auto p-1">
        <div className="flex flex-1 items-center gap-2">
          {Array.from({ length: filterCount }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-40 lg:w-56" />
          ))}
        </div>
        <Skeleton className="ml-auto hidden h-8 w-24 lg:flex" />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead
                  key={i}
                  style={{
                    width: cellWidths[i] ?? cellWidths[cellWidths.length - 1],
                    minWidth: shrinkZero ? '0' : 'auto',
                  }}
                >
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={j}
                    style={{
                      width: cellWidths[j] ?? cellWidths[cellWidths.length - 1],
                      minWidth: shrinkZero ? '0' : 'auto',
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-8">
        <Skeleton className="h-8 w-40 shrink-0" />
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-8 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="hidden size-8 lg:block" />
            <Skeleton className="size-8" />
            <Skeleton className="size-8" />
            <Skeleton className="hidden size-8 lg:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
