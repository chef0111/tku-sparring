import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../ui/field';
import { useFieldContext } from './hooks';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type FormControlProps = {
  label?: string;
  description?: string;
  fieldClassName?: string;
  descPosition?: 'after-label' | 'after-field';
  errorMessage?: boolean;
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
  errorMessage = true,
}: FormBaseProps) {
  const field = useFieldContext();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const labelElement = label && (
    <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
  );
  const descElement = description && (
    <FieldDescription>{description}</FieldDescription>
  );
  const errorElem = isInvalid && errorMessage === true && (
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
          <FieldContent>{children}</FieldContent>
          <FieldContent>
            {label && labelElement}
            {descPosition === 'after-label' && descElement}
            {errorMessage && errorElem}
          </FieldContent>
        </>
      ) : (
        <>
          <FieldContent>
            {labelElement}
            {descPosition === 'after-label' && descElement}
          </FieldContent>
          <FieldContent>
            {children}
            {descPosition === 'after-field' && descElement}
            {errorMessage && errorElem}
          </FieldContent>
        </>
      )}
    </Field>
  );
}
