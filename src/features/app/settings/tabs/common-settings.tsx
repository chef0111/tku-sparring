import { durationGroup } from '../constant/form';
import type { FormNumberInputProps } from '@/components/form/form-input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

type FieldNumberInput = {
  NumberInput: React.ComponentType<FormNumberInputProps>;
};

interface CommonFieldsProps {
  form: {
    AppField: React.ComponentType<{
      name: 'roundDuration' | 'breakDuration' | 'maxHealth';
      children: (field: FieldNumberInput) => React.ReactNode;
    }>;
  };
  className?: string;
}

export const CommonSettings = ({ form, className }: CommonFieldsProps) => {
  return (
    <>
      <DurationFields form={form} className={className} />
      <MaxHealthField form={form} className={className} />
    </>
  );
};

export const DurationFields = ({ form, className }: CommonFieldsProps) => (
  <FieldGroup className={cn('settings-field-group', className)}>
    <FieldLabel className="settings-group-label">
      SET ROUND &amp; BREAK DURATIONS
    </FieldLabel>
    <FieldGroup className="flex-row">
      {durationGroup.map((duration) => (
        <form.AppField key={duration.name} name={duration.name}>
          {(field) => (
            <field.NumberInput
              label={duration.label}
              className="h-10 w-full text-center"
              min={1}
              step={5}
            />
          )}
        </form.AppField>
      ))}
    </FieldGroup>
  </FieldGroup>
);

export const MaxHealthField = ({ form, className }: CommonFieldsProps) => (
  <FieldGroup className={cn('settings-field-group', className)}>
    <FieldLabel className="settings-group-label">MAXIMUM HEALTH</FieldLabel>
    <FieldGroup className="flex-row">
      <form.AppField name="maxHealth">
        {(field) => (
          <field.NumberInput
            className="h-10 w-full text-center"
            min={1}
            step={10}
          />
        )}
      </form.AppField>
    </FieldGroup>
  </FieldGroup>
);
