import { SaveIcon, Trash2 } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { SelectItem } from '@/components/ui/select';
import { useAppForm } from '@/components/form/hooks';
import { useDeleteDivision, useUpdateDivision } from '@/queries/division';
import { Spinner } from '@/components/ui/spinner';
import { BELT_LEVELS } from '@/config/athlete';

interface DivisionSettingsSheetProps {
  onOpenChange: (open: boolean) => void;
  division: DivisionData | null;
}

export function DivisionSettingsSheet({
  onOpenChange,
  division,
}: DivisionSettingsSheetProps) {
  if (!division) return null;

  return (
    <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
      <SheetHeader>
        <SheetTitle className="text-lg font-semibold">
          Division Settings
        </SheetTitle>
        <SheetDescription>
          Edit constraints, arena, and preferences for {division.name}.
        </SheetDescription>
      </SheetHeader>

      <DivisionSettingsForm
        division={division}
        onClose={() => onOpenChange(false)}
      />
    </SheetContent>
  );
}

interface DivisionSettingsFormProps {
  division: DivisionData;
  onClose: () => void;
}

function DivisionSettingsForm({
  division,
  onClose,
}: DivisionSettingsFormProps) {
  const updateDivision = useUpdateDivision({ onSuccess: onClose });
  const deleteDivision = useDeleteDivision({ onSuccess: onClose });

  const athleteCount = division._count.tournamentAthletes;
  const thirdPlaceAllowed = athleteCount >= 4;

  const GENDER_ANY = '__any__' as const;

  const form = useAppForm({
    defaultValues: {
      name: division.name,
      gender: division.gender ?? GENDER_ANY,
      beltMin: division.beltMin ?? undefined,
      beltMax: division.beltMax ?? undefined,
      weightMin: division.weightMin ?? undefined,
      weightMax: division.weightMax ?? undefined,
      thirdPlaceMatch: division.thirdPlaceMatch,
    },
    onSubmit: ({ value }) => {
      updateDivision.mutate({
        id: division.id,
        name: value.name,
        gender:
          value.gender === GENDER_ANY ? null : (value.gender as 'M' | 'F'),
        beltMin: value.beltMin ?? null,
        beltMax: value.beltMax ?? null,
        weightMin: value.weightMin ?? null,
        weightMax: value.weightMax ?? null,
        thirdPlaceMatch: value.thirdPlaceMatch,
      });
    },
  });

  return (
    <form
      className="flex flex-1 flex-col gap-4 px-4 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => (
          <field.Input label="Division Name" placeholder="e.g. Division A" />
        )}
      </form.AppField>

      <form.AppField name="gender">
        {(field) => (
          <field.Select label="Gender Constraint" placeholder="Any">
            <SelectItem value={GENDER_ANY}>Any</SelectItem>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </field.Select>
        )}
      </form.AppField>

      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="beltMin">
          {(field) => (
            <field.NumberSelect
              label="Min Belt"
              placeholder="Any"
              emptyValue="__any__"
              emptyLabel="Any"
            >
              {BELT_LEVELS.map((b) => (
                <SelectItem key={b.value} value={String(b.value)}>
                  {b.label}
                </SelectItem>
              ))}
            </field.NumberSelect>
          )}
        </form.AppField>
        <form.AppField name="beltMax">
          {(field) => (
            <field.NumberSelect
              label="Max Belt"
              placeholder="Any"
              emptyValue="__any__"
              emptyLabel="Any"
            >
              {BELT_LEVELS.map((b) => (
                <SelectItem key={b.value} value={String(b.value)}>
                  {b.label}
                </SelectItem>
              ))}
            </field.NumberSelect>
          )}
        </form.AppField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form.AppField name="weightMin">
          {(field) => (
            <field.NumberInput
              label="Min Weight (kg)"
              min={20}
              max={150}
              step={1}
            />
          )}
        </form.AppField>
        <form.AppField name="weightMax">
          {(field) => (
            <field.NumberInput
              label="Max Weight (kg)"
              min={20}
              max={150}
              step={1}
            />
          )}
        </form.AppField>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-fit">
            <form.AppField name="thirdPlaceMatch">
              {(field) => (
                <field.Checkbox
                  label="Third-place match"
                  disabled={!thirdPlaceAllowed}
                />
              )}
            </form.AppField>
          </div>
        </TooltipTrigger>
        {!thirdPlaceAllowed && (
          <TooltipContent side="right" className="max-w-xs">
            Third-place match needs at least 4 athletes in the division.
          </TooltipContent>
        )}
      </Tooltip>

      <div className="flex items-center gap-2 p-0 pt-6">
        <Button
          type="button"
          variant="destructive"
          onClick={() => deleteDivision.mutate({ id: division.id })}
          disabled={deleteDivision.isPending}
        >
          <Trash2 className="mr-1 size-3.5" />
          Delete Division
        </Button>
        <div className="flex-1" />
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={updateDivision.isPending}>
          {updateDivision.isPending ? (
            <>
              <Spinner />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <SaveIcon />
              <span>Save</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
