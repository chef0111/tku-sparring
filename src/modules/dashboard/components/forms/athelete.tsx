import type { AthleteData } from '@/modules/dashboard/types';
import { SelectItem } from '@/components/ui/select';
import { useAppForm } from '@/components/form/hooks';
import { FieldGroup } from '@/components/ui/field';
import { beltLevels } from '@/modules/dashboard/tournament/common/constant';

interface AthleteFormProps {
  athlete: AthleteData | null;
  onSubmit: (data: {
    code: string;
    name: string;
    beltLevel: string;
    weight: number;
    affiliation: string;
  }) => void;
  children?: React.ReactNode;
}

export function AthleteForm({ athlete, onSubmit, children }: AthleteFormProps) {
  const form = useAppForm({
    defaultValues: {
      code: athlete?.code ?? '',
      name: athlete?.name ?? '',
      beltLevel: athlete?.beltLevel ?? '',
      weight: athlete?.weight ?? 0,
      affiliation: athlete?.affiliation ?? '',
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-4">
        <form.AppField name="code">
          {(field) => <field.Input label="Code" placeholder="ATH-001" />}
        </form.AppField>

        <form.AppField name="name">
          {(field) => (
            <field.Input label="Athlete Name" placeholder="John Doe" />
          )}
        </form.AppField>

        <form.AppField name="beltLevel">
          {(field) => (
            <field.Select label="Belt Level">
              {beltLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </field.Select>
          )}
        </form.AppField>

        <form.AppField name="weight">
          {(field) => (
            <field.NumberInput
              label="Weight (kg)"
              placeholder="0"
              min={0}
              step={0.1}
            />
          )}
        </form.AppField>

        <form.AppField name="affiliation">
          {(field) => (
            <field.Input label="Affiliation" placeholder="Club name" />
          )}
        </form.AppField>
      </FieldGroup>

      {children}
    </form>
  );
}
