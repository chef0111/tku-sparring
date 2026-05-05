import * as React from 'react';
import { FormBase } from './form-base';
import { useFieldContext } from './hooks';
import type { FormControlProps } from './form-base';
import { NumberInput } from '@/components/input/number-input';
import { PasswordInput } from '@/components/input/password-input';
import { Input } from '@/components/ui/input';
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
  ...inputProps
}: FormInputProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase
      label={label}
      description={description}
      descPosition={descPosition}
      className={fieldClassName}
    >
      <PasswordInput
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...inputProps}
      />
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
  step = 1,
  min,
  max,
  ...inputProps
}: FormNumberInputProps) {
  const field = useFieldContext<number | undefined>();
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
      className={fieldClassName}
    >
      <NumberInput
        id={field.name}
        name={field.name}
        type="number"
        value={field.state.value ?? ''}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const value =
            e.target.value === '' ? undefined : Number(e.target.value);
          field.handleChange(value);
        }}
        aria-invalid={isInvalid}
        step={step}
        min={min}
        max={max}
        handleIncrement={handleIncrement}
        handleDecrement={handleDecrement}
        disableIncrement={max !== undefined && (field.state.value || 0) >= max}
        disableDecrement={min !== undefined && (field.state.value || 0) <= min}
        {...inputProps}
      />
    </FormBase>
  );
}
