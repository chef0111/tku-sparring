import { useFieldContext } from './hooks';
import type { ReactNode } from 'react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';

export type FormControlProps = {
  label?: string;
  description?: string;
  fieldClassName?: string;
  descPosition?: 'after-label' | 'after-field';
};

type FormBaseProps = FormControlProps & {
  children: ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal' | 'responsive' | null;
  controlFirst?: boolean;
};

export function FormBase({
  children,
  label,
  description,
  className,
  controlFirst,
  orientation,
  descPosition = 'after-label',
}: FormBaseProps) {
  const field = useFieldContext();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const labelElement = <FieldLabel htmlFor={field.name}>{label}</FieldLabel>;
  const descElement = description && (
    <FieldDescription>{description}</FieldDescription>
  );
  const errorElem = isInvalid && (
    <FieldError
      errors={[field.state.meta.errors[0]]}
      className="-mt-1 w-full text-left"
    />
  );

  return (
    <Field
      data-invalid={isInvalid}
      orientation={orientation}
      className={cn('gap-1.5', className)}
    >
      {controlFirst ? (
        <>
          {children}
          <FieldContent>
            {labelElement}
            {descPosition === 'after-label' && descElement}
            {errorElem}
          </FieldContent>
        </>
      ) : (
        <>
          <FieldContent>
            {labelElement}
            {descPosition === 'after-label' && descElement}
          </FieldContent>
          {children}
          {descPosition === 'after-field' && descElement}
          {errorElem}
        </>
      )}
    </Field>
  );
}
