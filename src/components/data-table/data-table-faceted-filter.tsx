import { PlusCircle, XCircle, XIcon } from 'lucide-react';
import * as React from 'react';
import type { Column } from '@tanstack/react-table';

import type { Option } from '@/types/data-table';
import type { DataTableControlledState } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  state?: DataTableControlledState;
  title?: string;
  options: Array<Option>;
  multiple?: boolean;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  state,
  title,
  options,
  multiple,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);

  const controlledFilterValue = state?.columnFilters.find(
    (filter) => filter.id === column?.id
  )?.value;
  const columnFilterValue = controlledFilterValue ?? column?.getFilterValue();
  const selectedValues = new Set(
    Array.isArray(columnFilterValue) ? columnFilterValue : []
  );

  const searchTitle = title ?? 'option';

  const comboboxValue = multiple
    ? options.filter((o) => selectedValues.has(o.value))
    : (options.find((o) => selectedValues.has(o.value)) ?? null);

  const onValueChange = React.useCallback(
    (next: Option | Array<Option> | null) => {
      if (!column) return;

      if (multiple) {
        const nextOptions = Array.isArray(next) ? next : [];
        const vals = nextOptions.map((o) => o.value);
        column.setFilterValue(vals.length ? vals : undefined);
      } else {
        const opt = next as Option | null;
        column.setFilterValue(opt ? [opt.value] : undefined);
        setOpen(false);
      }
    },
    [column, multiple]
  );

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (!column) return;
      // Route clears through the same path as choosing "no value" so Base UI combobox
      // selection state and nuqs-driven column filters stay aligned (trigger X only used
      // setFilterValue before, which could leave URL updates losing the race).
      onValueChange(multiple ? [] : null);
    },
    [column, multiple, onValueChange]
  );

  return (
    <Combobox
      isItemEqualToValue={(a, b) => a.value === b.value}
      itemToStringLabel={(o) => o.label}
      itemToStringValue={(o) => o.value}
      items={options}
      multiple={!!multiple}
      onOpenChange={setOpen}
      onValueChange={onValueChange}
      open={open}
      value={comboboxValue}
    >
      <ComboboxTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'border-dashed font-normal'
        )}
        showChevron={false}
      >
        {selectedValues?.size > 0 ? (
          <div
            role="button"
            aria-label={`Clear ${title} filter`}
            tabIndex={0}
            className="focus-visible:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none"
            onClick={onReset}
          >
            <XCircle />
          </div>
        ) : (
          <PlusCircle />
        )}
        {title}
        {selectedValues?.size > 0 && (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 my-auto data-[orientation=vertical]:h-4"
            />
            <Badge
              variant="secondary"
              className="rounded-sm px-1 font-normal lg:hidden"
            >
              {selectedValues.size}
            </Badge>
            <div className="hidden items-center gap-1 lg:flex">
              {selectedValues.size > 2 ? (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedValues.size} selected
                </Badge>
              ) : (
                options
                  .filter((option) => selectedValues.has(option.value))
                  .map((option) => (
                    <Badge
                      variant="secondary"
                      key={option.value}
                      className="rounded-sm px-1 font-normal"
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        )}
      </ComboboxTrigger>
      <ComboboxContent align="center">
        <ComboboxInput showTrigger={false} placeholder={searchTitle} />
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList className="max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto">
          {(option: Option) => {
            const isSelected = selectedValues.has(option.value);

            return (
              <ComboboxItem
                key={option.value}
                className="[&>span.pointer-events-none.absolute]:hidden"
                value={option}
              >
                <Checkbox
                  checked={isSelected}
                  className="data-checked:text-primary-foreground!"
                  style={{ color: 'var(--primary-foreground) !important' }}
                />
                {option.icon && <option.icon />}
                <span className="min-w-0 flex-1 whitespace-nowrap">
                  {option.label}
                </span>
                {option.count !== undefined && (
                  <span className="ml-auto font-mono text-xs">
                    {option.count}
                  </span>
                )}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
        {selectedValues.size > 0 && (
          <div className="mx-1 mb-1">
            <ComboboxSeparator />
            <div
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'w-full scale-100! justify-between px-1.5 font-normal'
              )}
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              <span className="pointer-events-none">Clear filters</span>
              <XIcon className="size-4 shrink-0" />
            </div>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
