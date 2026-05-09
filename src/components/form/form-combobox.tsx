import * as React from 'react';
import { IconChevronDown } from '@tabler/icons-react';

import { FormBase } from './form-base';
import { useFieldContext } from './hooks';
import type { FormControlProps } from './form-base';
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

export interface ComboboxData {
  label?: string;
  value?: string;
}

type FormComboboxProps = FormControlProps & {
  data: Array<ComboboxData>;
  type: string;
  disabled?: boolean;
  itemClassName?: string;
};

export function FormCombobox({
  data,
  type,
  descPosition,
  disabled,
  itemClassName,
  ...props
}: FormComboboxProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const [open, setOpen] = React.useState(false);

  const [width, setWidth] = React.useState(200);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = (entry.target as HTMLElement).offsetWidth;
        if (nextWidth) {
          setWidth(nextWidth);
        }
      }
    });

    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const items = React.useMemo(
    () => data.filter((d): d is ComboboxData & { value: string } => !!d.value),
    [data]
  );

  const selectedLabel = items.find((i) => i.value === field.state.value)?.label;

  return (
    <FormBase {...props} descPosition={descPosition}>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            aria-invalid={isInvalid}
            className="w-full justify-between font-normal"
            disabled={disabled}
            id={field.name}
            type="button"
            variant="outline"
            onBlur={field.handleBlur}
          >
            <span className="truncate">
              {selectedLabel ?? `Select ${type}...`}
            </span>
            <IconChevronDown className="text-muted-foreground size-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto max-w-(--radix-popover-content-available-width) min-w-(--radix-popover-trigger-width) p-0"
          style={{ width }}
        >
          <Command>
            <CommandInput
              className="min-w-[calc(var(--radix-popover-trigger-width)-2.5rem)]"
              placeholder={`Search ${type}...`}
            />
            <CommandEmpty>{`No ${type} found.`}</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    className={itemClassName}
                    value={item.value}
                    onSelect={() => {
                      field.handleChange(item.value);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FormBase>
  );
}
