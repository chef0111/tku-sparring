import { Check, Settings2 } from 'lucide-react';
import { useMemo } from 'react';
import type { ComponentProps } from 'react';
import type { Column, Table } from '@tanstack/react-table';

import type { DataTableControlledState } from '@/hooks/use-data-table';
import { buttonVariants } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

interface DataTableViewOptionsProps<TData> extends Omit<
  ComponentProps<typeof ComboboxContent>,
  'children'
> {
  table: Table<TData>;
  state: DataTableControlledState;
  disabled?: boolean;
}

export function DataTableViewOptions<TData>({
  table,
  state,
  disabled,
  className,
  ...contentProps
}: DataTableViewOptionsProps<TData>) {
  const columnVisibility = state.columnVisibility;

  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide()
    ) as Array<Column<TData>>;

  const items = useMemo(() => columns, [columns]);

  return (
    <Combobox
      disabled={disabled}
      itemToStringLabel={(column: Column<TData>) =>
        column.columnDef.meta?.label ?? column.id
      }
      itemToStringValue={(column: Column<TData>) => column.id}
      items={items}
    >
      <ComboboxTrigger
        aria-label="Toggle columns"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'ml-auto hidden h-8 font-normal lg:flex'
        )}
        disabled={disabled}
        showChevron={false}
      >
        <Settings2 className="text-muted-foreground" />
        View
      </ComboboxTrigger>
      <ComboboxContent className={cn('w-44', className)} {...contentProps}>
        <ComboboxInput showTrigger={false} placeholder="Search columns..." />
        <ComboboxEmpty>No columns found.</ComboboxEmpty>
        <ComboboxList>
          {(column: Column<TData>) => {
            const isVisible =
              columnVisibility[column.id] ?? column.getIsVisible();

            return (
              <ComboboxItem
                key={column.id}
                className="relative [&>span.pointer-events-none.absolute]:hidden"
                value={column}
                onClick={() => {
                  column.toggleVisibility(!isVisible);
                }}
              >
                <span className="truncate">
                  {column.columnDef.meta?.label ?? column.id}
                </span>
                <Check
                  className={cn(
                    'absolute right-2 size-4',
                    isVisible ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
