import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<typeof Input> & {
  handleIncrement?: () => void;
  handleDecrement?: () => void;
  disableIncrement?: boolean;
  disableDecrement?: boolean;
};

export function NumberInput({
  className,
  handleIncrement,
  handleDecrement,
  disableIncrement,
  disableDecrement,
  ...props
}: InputProps) {
  return (
    <div className="relative">
      <Input
        type="numer"
        className={cn(
          '[appearance:textfield]! [-moz-appearance:textfield]! [&::-webkit-inner-spin-button]:appearance-none! [&::-webkit-outer-spin-button]:appearance-none!',
          className
        )}
        {...props}
      />
      <ButtonGroup
        orientation="vertical"
        className="absolute top-1/4 right-0 h-1/2 -translate-y-1/2"
      >
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          className="h-full w-5 p-0 in-data-[slot=button-group]:rounded-tl-none!"
          onClick={handleIncrement}
          disabled={disableIncrement}
        >
          <IconChevronUp className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          className="h-full w-5 p-0 in-data-[slot=button-group]:rounded-bl-none!"
          onClick={handleDecrement}
          disabled={disableDecrement}
        >
          <IconChevronDown className="size-3" />
        </Button>
      </ButtonGroup>
    </div>
  );
}
