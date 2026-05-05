import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { SelectItem } from '@/components/ui/select';
import { BELT_LEVELS, GENDER_OPTIONS } from '@/config/athlete';
import {
  useCheckDuplicate,
  useCreateAthleteProfile,
  useUpdateAthleteProfile,
} from '@/queries/athlete-profiles';
import { useAppForm } from '@/components/form/hooks';
import { Spinner } from '@/components/ui/spinner';

interface AthleteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete?: AthleteProfileData;
}

interface FormValues {
  athleteCode: string;
  name: string;
  gender: 'M' | 'F';
  beltLevel: number;
  weight: number;
  affiliation: string;
}

interface PossibleDuplicate {
  id: string;
  name: string;
  affiliation: string;
  gender: string;
  beltLevel: number;
  weight: number;
}

export function AthleteFormDialog({
  open,
  onOpenChange,
  athlete,
}: AthleteFormDialogProps) {
  const isEditing = !!athlete;
  const [hardBlockError, setHardBlockError] = useState<string | null>(null);
  const [possibleDuplicates, setPossibleDuplicates] = useState<
    Array<PossibleDuplicate>
  >([]);

  const checkDuplicate = useCheckDuplicate();

  const createMutation = useCreateAthleteProfile({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateAthleteProfile({
    onSuccess: () => onOpenChange(false),
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
    onSubmit: async ({ value }) => {
      setHardBlockError(null);

      if (isEditing) {
        updateMutation.mutate({
          id: athlete.id,
          athleteCode: value.athleteCode || undefined,
          name: value.name,
          gender: value.gender,
          beltLevel: value.beltLevel,
          weight: value.weight,
          affiliation: value.affiliation,
        });
        return;
      }

      // Run de-dup check before creating
      const result = await checkDuplicate.mutateAsync({
        athleteCode: value.athleteCode || undefined,
        name: value.name,
        gender: value.gender,
        beltLevel: value.beltLevel,
        weight: value.weight,
        affiliation: value.affiliation,
      });

      if (result.isHardBlock) {
        setHardBlockError('An athlete with this code and name already exists.');
        return;
      }

      if (result.isDuplicate) {
        setPossibleDuplicates(result.matches as Array<PossibleDuplicate>);
        return;
      }

      createMutation.mutate({
        athleteCode: value.athleteCode || undefined,
        name: value.name,
        gender: value.gender,
        beltLevel: value.beltLevel,
        weight: value.weight,
        affiliation: value.affiliation,
        confirmDuplicate: false,
      });
    },
  });

  const onConfirmDuplicate = () => {
    const value = form.state.values;
    createMutation.mutate(
      {
        athleteCode: value.athleteCode || undefined,
        name: value.name,
        gender: value.gender,
        beltLevel: value.beltLevel,
        weight: value.weight,
        affiliation: value.affiliation,
        confirmDuplicate: true,
      },
      {
        onSuccess: () => {
          setPossibleDuplicates([]);
          onOpenChange(false);
        },
      }
    );
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    checkDuplicate.isPending;

  function onClose(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setHardBlockError(null);
      setPossibleDuplicates([]);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Athlete' : 'Add Athlete'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update this athlete profile.'
                : 'Create a new athlete in the global registry.'}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-4">
            <form.AppField name="athleteCode">
              {(field) => (
                <field.Input
                  label="Athlete Code"
                  description="Optional"
                  descPosition="after-label"
                  placeholder="e.g. TKD-001"
                  onValueChange={() => setHardBlockError(null)}
                />
              )}
            </form.AppField>

            <form.AppField
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? 'Name is required' : undefined,
              }}
            >
              {(field) => <field.Input label="Name" placeholder="Full name" />}
            </form.AppField>

            <form.AppField name="gender">
              {(field) => (
                <field.Select label="Gender" placeholder="Select gender">
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
                >
                  {BELT_LEVELS.map((b) => (
                    <SelectItem key={b.value} value={String(b.value)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </field.NumberSelect>
              )}
            </form.AppField>

            <form.AppField
              name="weight"
              validators={{
                onChange: ({ value }) => {
                  if (value === undefined || Number.isNaN(value))
                    return 'Weight is required';
                  if (value < 20) return 'Weight must be at least 20 kg';
                  if (value > 150) return 'Weight must be at most 150 kg';
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.NumberInput
                  label="Weight (kg)"
                  placeholder="60"
                  min={20}
                  max={150}
                  step={1}
                />
              )}
            </form.AppField>

            <form.AppField
              name="affiliation"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? 'Affiliation is required' : undefined,
              }}
            >
              {(field) => (
                <field.Input
                  label="Affiliation"
                  placeholder="Club or gym name"
                />
              )}
            </form.AppField>

            {/* Hard block error */}
            {hardBlockError && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/20 border"
              >
                <AlertTriangle className="size-4" />
                <AlertDescription>{hardBlockError}</AlertDescription>
              </Alert>
            )}

            {/* Possible duplicate warning */}
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
                      disabled={createMutation.isPending}
                      onClick={onConfirmDuplicate}
                    >
                      {createMutation.isPending
                        ? 'Creating...'
                        : 'Create Anyway'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || possibleDuplicates.length > 0}
            >
              {isPending && <Spinner className="text-primary-foreground" />}
              {isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Athlete'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
