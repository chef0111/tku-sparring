import * as React from 'react';
import { flexRender } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import type { Row, Table as TanstackTable } from '@tanstack/react-table';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getColumnPinningStyle } from '@/lib/table/data-table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> extends Omit<
  React.ComponentProps<'div'>,
  'onDragEnd'
> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  enableDrag?: boolean;
  onDragEnd?: (event: DragEndEvent) => void;
  onRowAdd?: () => void;
  getRowId?: (row: TData) => UniqueIdentifier;
}

function DraggableRow<TData>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          style={{
            ...getColumnPinningStyle({ column: cell.column }),
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<TData>({
  table,
  actionBar,
  enableDrag = false,
  onDragEnd,
  onRowAdd,
  getRowId,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<Array<UniqueIdentifier>>(() => {
    if (!enableDrag) return [];
    return table.getRowModel().rows.map((row) => {
      if (getRowId) {
        return getRowId(row.original);
      }
      return row.id;
    });
  }, [table, enableDrag, getRowId]);

  const tableContent = (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="bg-sidebar!">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className="bg-sidebar!"
                style={{
                  ...getColumnPinningStyle({ column: header.column }),
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          enableDrag ? (
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.map((row) => (
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContext>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="hover:bg-muted/50!"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="hover:bg-muted/50!"
                    style={{
                      ...getColumnPinningStyle({ column: cell.column }),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
        {onRowAdd && (
          <TableRow
            className="hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={onRowAdd}
          >
            <TableCell
              colSpan={table.getAllColumns().length}
              className="text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Plus className="mx-1.5 size-4" />
                <span className="text-sm">Add row</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div
      className={cn('flex w-full flex-col gap-2.5 overflow-auto', className)}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md border">
        {enableDrag ? (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            {tableContent}
          </DndContext>
        ) : (
          tableContent
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
