import * as React from 'react';
import { Settings2 } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DataTableViewOptionsProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>;
  disabled?: boolean;
}

export function DataTableViewOptions<TData>({
  table,
  disabled,
  ...props
}: DataTableViewOptionsProps<TData>) {
  const columnVisibility = table.getState().columnVisibility;

  const columns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== 'undefined' && column.getCanHide()
        ),
    [table, columnVisibility]
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Toggle columns"
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 font-normal lg:flex"
            disabled={disabled}
          >
            <Settings2 className="text-muted-foreground" />
            View
          </Button>
        }
      />
      <PopoverContent className="w-44 p-0" {...props}>
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {columns.map((column) => (
                <CommandItem
                  key={column.id}
                  data-checked={column.getIsVisible()}
                  className="hover:bg-accent! bg-transparent!"
                  onSelect={() =>
                    column.toggleVisibility(!column.getIsVisible())
                  }
                >
                  <span className="truncate">
                    {column.columnDef.meta?.label ?? column.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
