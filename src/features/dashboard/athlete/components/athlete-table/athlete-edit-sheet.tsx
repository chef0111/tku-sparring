import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type z from 'zod';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { EditAthleteSchema } from '@/lib/validations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { BELT_LEVELS, GENDER_OPTIONS } from '@/config/athlete';
import { useAppForm } from '@/components/form/hooks';
import {
  useCheckDuplicate,
  useUpdateAthleteProfile,
} from '@/queries/athlete-profiles';

interface AthleteEditSheetProps {
  athlete: AthleteProfileData | null;
  onOpenChange: (athlete: AthleteProfileData | null) => void;
}

type FormValues = z.infer<typeof EditAthleteSchema>;

interface PossibleDuplicate {
  id: string;
  name: string;
  affiliation: string;
  gender: string;
  beltLevel: number;
  weight: number;
}

export function AthleteEditSheet({
  athlete,
  onOpenChange,
}: AthleteEditSheetProps) {
  const [hardBlockError, setHardBlockError] = useState<string | null>(null);
  const [possibleDuplicates, setPossibleDuplicates] = useState<
    Array<PossibleDuplicate>
  >([]);

  const checkDuplicate = useCheckDuplicate();

  const updateMutation = useUpdateAthleteProfile({
    onSuccess: () => onOpenChange(null),
  });

  const form = useAppForm({
    defaultValues: {
      athleteCode: athlete?.athleteCode ?? '',
      name: athlete?.name ?? '',
      gender: (athlete?.gender as 'M' | 'F') ?? 'M',
      beltLevel: athlete?.beltLevel ?? 0,
      weight: athlete?.weight ?? 60,
      affiliation: athlete?.affiliation ?? '',
    } as FormValues,
    validators: {
      onSubmit: EditAthleteSchema,
    },
    onSubmit: async ({ value }) => {
      if (!athlete) return;
      setHardBlockError(null);

      const nameOrCodeChanged =
        value.name.trim() !== (athlete.name ?? '').trim() ||
        (value.athleteCode || '') !== (athlete.athleteCode || '');

      if (nameOrCodeChanged) {
        const result = await checkDuplicate.mutateAsync({
          athleteCode: value.athleteCode.trim(),
          name: value.name,
          gender: value.gender,
          beltLevel: value.beltLevel,
          weight: value.weight,
          affiliation: value.affiliation,
        });

        if (result.isHardBlock) {
          setHardBlockError(
            'An athlete with this code and name already exists.'
          );
          return;
        }

        if (result.isDuplicate) {
          setPossibleDuplicates(result.matches as Array<PossibleDuplicate>);
          return;
        }
      }

      updateMutation.mutate({
        id: athlete.id,
        athleteCode: value.athleteCode.trim(),
        name: value.name,
        gender: value.gender,
        beltLevel: value.beltLevel,
        weight: value.weight,
        affiliation: value.affiliation,
      });
    },
  });

  const onConfirmDuplicate = () => {
    if (!athlete) return;
    const value = form.state.values;
    updateMutation.mutate(
      {
        id: athlete.id,
        athleteCode: value.athleteCode.trim(),
        name: value.name,
        gender: value.gender,
        beltLevel: value.beltLevel,
        weight: value.weight,
        affiliation: value.affiliation,
      },
      {
        onSuccess: () => {
          setPossibleDuplicates([]);
          onOpenChange(null);
        },
      }
    );
  };

  const isPending = updateMutation.isPending || checkDuplicate.isPending;

  function onClose() {
    form.reset();
    setHardBlockError(null);
    setPossibleDuplicates([]);
    onOpenChange(null);
  }

  return (
    <Sheet
      key={athlete?.id}
      open={!!athlete}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="flex flex-col gap-0 sm:max-w-md!">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetHeader className="px-6 py-4">
            <SheetTitle>Edit Athlete</SheetTitle>
            <SheetDescription>Update this athlete profile.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <FieldGroup className="gap-4 py-4">
              <form.AppField name="athleteCode">
                {(field) => (
                  <field.Input
                    label="Athlete ID"
                    descPosition="after-label"
                    placeholder="e.g. 23520111"
                    onValueChange={() => setHardBlockError(null)}
                  />
                )}
              </form.AppField>

              <form.AppField name="name">
                {(field) => (
                  <field.Input label="Name" placeholder="Full name" />
                )}
              </form.AppField>

              <form.AppField name="gender">
                {(field) => (
                  <field.Select
                    label="Gender"
                    placeholder="Select gender"
                    className="max-w-40"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </field.Select>
                )}
              </form.AppField>

              <form.AppField name="beltLevel">
                {(field) => (
                  <field.NumberSelect
                    label="Belt Level"
                    placeholder="Select belt level"
                    className="max-w-40"
                  >
                    {BELT_LEVELS.map((b) => (
                      <SelectItem key={b.value} value={String(b.value)}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </field.NumberSelect>
                )}
              </form.AppField>

              <form.AppField name="weight">
                {(field) => (
                  <field.NumberInput
                    label="Weight (kg)"
                    placeholder="60"
                    step={1}
                  />
                )}
              </form.AppField>

              <form.AppField name="affiliation">
                {(field) => (
                  <field.Input
                    label="Affiliation"
                    placeholder="Club or gym name"
                  />
                )}
              </form.AppField>

              {hardBlockError && (
                <Alert
                  variant="destructive"
                  className="bg-destructive/10 border-destructive/20 border"
                >
                  <AlertTriangle className="size-4" />
                  <AlertDescription>{hardBlockError}</AlertDescription>
                </Alert>
              )}

              {possibleDuplicates.length > 0 && (
                <Alert
                  variant="destructive"
                  className="bg-destructive/10 border-destructive/20 border"
                >
                  <AlertTriangle className="size-4" />
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">Possible duplicate detected</p>
                    <p className="text-muted-foreground text-sm">
                      The following existing athletes match this name,
                      affiliation, belt, and weight:
                    </p>
                    <ul className="space-y-1 text-sm">
                      {possibleDuplicates.map((d) => (
                        <li key={d.id} className="font-medium">
                          {d.name} · {d.affiliation}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPossibleDuplicates([])}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={onConfirmDuplicate}
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save Anyway'}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || possibleDuplicates.length > 0}
            >
              {isPending && <Spinner className="text-primary-foreground" />}
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
