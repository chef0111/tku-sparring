import * as React from 'react';
import { useForm } from '@tanstack/react-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BELT_LEVELS, GENDER_OPTIONS } from '@/config/athlete';
import {
  useCheckDuplicate,
  useCreateAthleteProfile,
  useUpdateAthleteProfile,
} from '@/queries/athlete-profiles';

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
  const [hardBlockError, setHardBlockError] = React.useState<string | null>(
    null
  );
  const [possibleDuplicates, setPossibleDuplicates] = React.useState<
    Array<PossibleDuplicate>
  >([]);

  const checkDuplicate = useCheckDuplicate();

  const createMutation = useCreateAthleteProfile({
    onSuccess: () => onOpenChange(false),
  });

  const updateMutation = useUpdateAthleteProfile({
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm({
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

  function onClose(open: boolean) {
    if (!open) {
      form.reset();
      setHardBlockError(null);
      setPossibleDuplicates([]);
    }
    onOpenChange(open);
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

          <div className="grid gap-4 py-4">
            {/* Athlete Code */}
            <form.Field name="athleteCode">
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>
                    Athlete Code{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id={field.name}
                    placeholder="e.g. TKD-001"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setHardBlockError(null);
                    }}
                  />
                </div>
              )}
            </form.Field>

            {/* Name */}
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? 'Name is required' : undefined,
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    placeholder="Full name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            {/* Gender */}
            <form.Field name="gender">
              {(field) => (
                <div className="grid gap-1.5">
                  <Label>Gender</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as 'M' | 'F')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Belt Level */}
            <form.Field name="beltLevel">
              {(field) => (
                <div className="grid gap-1.5">
                  <Label>Belt Level</Label>
                  <Select
                    value={String(field.state.value)}
                    onValueChange={(v) => field.handleChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select belt level" />
                    </SelectTrigger>
                    <SelectContent>
                      {BELT_LEVELS.map((b) => (
                        <SelectItem key={b.value} value={String(b.value)}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Weight */}
            <form.Field
              name="weight"
              validators={{
                onChange: ({ value }) => {
                  if (!value || isNaN(value)) return 'Weight is required';
                  if (value < 20) return 'Weight must be at least 20 kg';
                  if (value > 150) return 'Weight must be at most 150 kg';
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Weight (kg)</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type="number"
                      inputMode="decimal"
                      placeholder="60"
                      min={20}
                      max={150}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value) || 0)
                      }
                      className="pr-10"
                    />
                    <span className="bg-accent text-muted-foreground absolute top-0 right-0 bottom-0 flex items-center rounded-r-md px-2 text-sm">
                      kg
                    </span>
                  </div>
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            {/* Affiliation */}
            <form.Field
              name="affiliation"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? 'Affiliation is required' : undefined,
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Affiliation</Label>
                  <Input
                    id={field.name}
                    placeholder="Club or gym name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-sm">
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            {/* Hard block error */}
            {hardBlockError && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>{hardBlockError}</AlertDescription>
              </Alert>
            )}

            {/* Possible duplicate warning */}
            {possibleDuplicates.length > 0 && (
              <Alert>
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
          </div>

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
