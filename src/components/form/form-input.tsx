import * as React from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { ButtonGroup } from '../ui/button-group';
import { FormBase } from './form-base';
import { useFieldContext } from './hooks';
import type { FormControlProps } from './form-base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type FormInputProps = FormControlProps &
  Omit<
    React.ComponentProps<'input'>,
    'id' | 'name' | 'value' | 'onChange' | 'onBlur'
  >;

type InputTooltip = {
  tooltip?: string;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
};

export function FormInput({
  label,
  description,
  fieldClassName,
  descPosition,
  errorMessage,
  tooltip,
  tooltipSide,
  ...inputProps
}: FormInputProps & InputTooltip) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const input = (
    <Input
      id={field.name}
      name={field.name}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      aria-invalid={isInvalid}
      {...inputProps}
    />
  );

  return (
    <FormBase
      label={label}
      description={description}
      descPosition={descPosition}
      errorMessage={errorMessage}
      className={fieldClassName}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger>{input}</TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        input
      )}
    </FormBase>
  );
}

export function FormPasswordInput({
  label,
  description,
  fieldClassName,
  descPosition,
  errorMessage,
  ...inputProps
}: FormInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <FormBase
      label={label}
      description={description}
      descPosition={descPosition}
      className={fieldClassName}
      errorMessage={errorMessage}
    >
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          className="pr-10 [&::-ms-reveal]:hidden"
          type={showPassword ? 'text' : 'password'}
          {...inputProps}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 hover:bg-transparent!"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <IconEyeOff className="size-5 shrink-0 opacity-50" />
          ) : (
            <IconEye className="size-5 shrink-0 opacity-50" />
          )}
        </Button>
      </div>
    </FormBase>
  );
}

export type FormNumberInputProps = FormControlProps &
  Omit<
    React.ComponentProps<'input'>,
    'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'type'
  > & {
    step?: number;
    min?: number;
    max?: number;
  };

export function FormNumberInput({
  label,
  description,
  fieldClassName,
  descPosition,
  errorMessage,
  step = 1,
  min,
  max,
  ...inputProps
}: FormNumberInputProps) {
  const field = useFieldContext<number>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const handleIncrement = () => {
    const newValue = (field.state.value || 0) + step;
    if (max === undefined || newValue <= max) {
      field.handleChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = (field.state.value || 0) - step;
    if (min === undefined || newValue >= min) {
      field.handleChange(newValue);
    }
  };

  return (
    <FormBase
      label={label}
      description={description}
      descPosition={descPosition}
      errorMessage={errorMessage}
      className={fieldClassName}
    >
      <div className="relative">
        <Input
          id={field.name}
          name={field.name}
          type="number"
          value={field.state.value ?? ''}
          onBlur={field.handleBlur}
          onChange={(e) => {
            const value = e.target.value === '' ? 0 : Number(e.target.value);
            field.handleChange(value);
          }}
          aria-invalid={isInvalid}
          step={step}
          min={min}
          max={max}
          title=""
          {...inputProps}
          className={cn(
            '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            inputProps.className
          )}
        />
        <ButtonGroup
          orientation="vertical"
          className="absolute top-1/4 right-0 h-1/2 -translate-y-1/2"
        >
          <Button
            type="button"
            variant="outline"
            className="h-full w-5 p-0 [&]:rounded-tl-none!"
            onClick={handleIncrement}
            disabled={max !== undefined && (field.state.value || 0) >= max}
          >
            <IconChevronUp className="size-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-full w-5 p-0 [&]:rounded-bl-none!"
            style={{ borderBottomLeftRadius: 0 }}
            onClick={handleDecrement}
            disabled={min !== undefined && (field.state.value || 0) <= min}
          >
            <IconChevronDown className="size-3" />
          </Button>
        </ButtonGroup>
      </div>
    </FormBase>
  );
}
