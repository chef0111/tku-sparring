import { PlusCircle, XCircle } from 'lucide-react';
import * as React from 'react';
import type { Column } from '@tanstack/react-table';
import type { DataTableControlledState } from '@/hooks/use-data-table';
import { NumberInput } from '@/components/input/number-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface Range {
  min: number;
  max: number;
}

type RangeValue = [number, number];

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function parseValuesAsNumbers(value: unknown): RangeValue | undefined {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (v) =>
        (typeof v === 'string' || typeof v === 'number') && !Number.isNaN(v)
    )
  ) {
    return [Number(value[0]), Number(value[1])];
  }

  return undefined;
}

interface DataTableSliderFilterProps<TData> {
  column: Column<TData, unknown>;
  state?: DataTableControlledState;
  title?: string;
}

export function DataTableSliderFilter<TData>({
  column,
  state,
  title,
}: DataTableSliderFilterProps<TData>) {
  const id = React.useId();

  const controlledFilterValue = state?.columnFilters.find(
    (filter) => filter.id === column.id
  )?.value;
  const columnFilterValue = parseValuesAsNumbers(
    controlledFilterValue ?? column.getFilterValue()
  );

  const defaultRange = column.columnDef.meta?.range;
  const unit = column.columnDef.meta?.unit;

  const { min, max, step } = React.useMemo<Range & { step: number }>(() => {
    let minValue = 0;
    let maxValue = 100;

    if (defaultRange && getIsValidRange(defaultRange)) {
      [minValue, maxValue] = defaultRange;
    } else {
      const values = column.getFacetedMinMaxValues();
      if (values && Array.isArray(values) && values.length === 2) {
        const [facetMinValue, facetMaxValue] = values;
        if (
          typeof facetMinValue === 'number' &&
          typeof facetMaxValue === 'number'
        ) {
          minValue = facetMinValue;
          maxValue = facetMaxValue;
        }
      }
    }

    const rangeSize = maxValue - minValue;
    const numStep =
      rangeSize <= 20
        ? 1
        : rangeSize <= 100
          ? Math.ceil(rangeSize / 20)
          : Math.ceil(rangeSize / 50);

    return { min: minValue, max: maxValue, step: numStep };
  }, [column, defaultRange]);

  const range = React.useMemo((): RangeValue => {
    return columnFilterValue ?? [min, max];
  }, [columnFilterValue, min, max]);

  const [fromInput, setFromInput] = React.useState(() => range[0]?.toString());
  const [toInput, setToInput] = React.useState(() => range[1]?.toString());

  React.useEffect(() => {
    setFromInput(range[0]?.toString() ?? '');
    setToInput(range[1]?.toString() ?? '');
  }, [range]);

  const formatValue = React.useCallback((value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  const onFromInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setFromInput(nextValue);

      if (nextValue === '') return;

      const numValue = Number(nextValue);
      if (!Number.isNaN(numValue) && numValue >= min && numValue <= range[1]) {
        column.setFilterValue([numValue, range[1]]);
      }
    },
    [column, min, range]
  );

  const onToInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setToInput(nextValue);

      if (nextValue === '') return;

      const numValue = Number(nextValue);
      if (!Number.isNaN(numValue) && numValue <= max && numValue >= range[0]) {
        column.setFilterValue([range[0], numValue]);
      }
    },
    [column, max, range]
  );

  const onSliderValueChange = React.useCallback(
    (value: RangeValue) => {
      if (Array.isArray(value) && value.length === 2) {
        column.setFilterValue(value);
      }
    },
    [column]
  );

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.target instanceof HTMLDivElement) {
        event.stopPropagation();
      }
      column.setFilterValue(undefined);
    },
    [column]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-dashed font-normal"
        >
          {columnFilterValue ? (
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
          <span>{title}</span>
          {columnFilterValue ? (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              {formatValue(columnFilterValue[0])} -{' '}
              {formatValue(columnFilterValue[1])}
              {unit ? ` ${unit}` : ''}
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="flex w-auto flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {title} ({unit})
          </p>
          <div className="flex items-center gap-4">
            <Label htmlFor={`${id}-from`} className="sr-only">
              From
            </Label>
            <NumberInput
              id={`${id}-from`}
              aria-valuemin={min}
              aria-valuemax={max}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={min.toString()}
              min={min}
              max={max}
              value={fromInput}
              onChange={onFromInputChange}
              className={cn('h-8 w-24')}
              handleIncrement={() => {
                const newValue = range[0] + step;
                if (newValue <= range[1]) {
                  column.setFilterValue([newValue, range[1]]);
                }
              }}
              handleDecrement={() => {
                const newValue = range[0] - step;
                if (newValue >= min) {
                  column.setFilterValue([newValue, range[1]]);
                }
              }}
              disableIncrement={range[0] + step > range[1]}
              disableDecrement={range[0] - step < min}
            />
            <Label htmlFor={`${id}-to`} className="sr-only">
              to
            </Label>
            <NumberInput
              id={`${id}-to`}
              aria-valuemin={min}
              aria-valuemax={max}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={max.toString()}
              min={min}
              max={max}
              value={toInput}
              onChange={onToInputChange}
              className={cn('h-8 w-24')}
              handleIncrement={() => {
                const newValue = range[1] + step;
                if (newValue <= max) {
                  column.setFilterValue([range[0], newValue]);
                }
              }}
              handleDecrement={() => {
                const newValue = range[1] - step;
                if (newValue >= range[0]) {
                  column.setFilterValue([range[0], newValue]);
                }
              }}
              disableIncrement={range[1] + step > max}
              disableDecrement={range[1] - step < range[0]}
            />
          </div>
          <Label htmlFor={`${id}-slider`} className="sr-only">
            {title} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            min={min}
            max={max}
            step={step}
            value={range}
            onValueChange={onSliderValueChange}
          />
        </div>
        <Button
          aria-label={`Clear ${title} filter`}
          variant="outline"
          size="sm"
          onClick={onReset}
        >
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  );
}
