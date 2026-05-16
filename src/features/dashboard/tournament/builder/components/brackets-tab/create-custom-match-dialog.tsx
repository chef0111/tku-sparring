import * as React from 'react';
import { PlusIcon } from 'lucide-react';
import type { CreateCustomMatchDTO } from '@/orpc/matches/dto';
import type { CreateCustomMatchFormValues } from '@/lib/validations';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
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
import { Spinner } from '@/components/ui/spinner';
import { useAppForm } from '@/components/form/hooks';
import { useTournamentBracket } from '@/features/dashboard/tournament/builder/context/tournament-bracket/use-tournament-bracket';
import {
  AthleteSelectionSync,
  DedupeAthleteSelection,
  buildSlot,
  matchOptionLabel,
} from '@/features/dashboard/tournament/builder/lib/custom-match';
import { CreateCustomMatchFormSchema } from '@/lib/validations';
import { useCreateCustomMatch } from '@/queries/matches';
import { Label } from '@/components/ui/label';

type FormValues = CreateCustomMatchFormValues;

export interface CreateCustomMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCustomMatchDialog({
  open,
  onOpenChange,
}: CreateCustomMatchDialogProps) {
  const {
    selectedGroupId: groupId,
    matches,
    athletes,
    matchLabel,
    tournamentStatus,
    readOnly,
  } = useTournamentBracket();

  const matchList = matches as Array<MatchData>;
  const athleteList = athletes as Array<TournamentAthleteData>;

  const blocked =
    readOnly ||
    !groupId ||
    matchList.length === 0 ||
    tournamentStatus === 'completed';

  const feederWinnerOptions = React.useMemo(
    () =>
      matchList.filter(
        (m) =>
          m.kind !== 'custom' &&
          m.status === 'complete' &&
          m.winnerTournamentAthleteId != null &&
          m.redTournamentAthleteId != null &&
          m.blueTournamentAthleteId != null
      ),
    [matchList]
  );

  const feederLoserOptions = React.useMemo(
    () =>
      matchList.filter(
        (m) =>
          m.kind !== 'custom' &&
          m.status === 'complete' &&
          m.winnerTournamentAthleteId != null &&
          m.redTournamentAthleteId != null &&
          m.blueTournamentAthleteId != null
      ),
    [matchList]
  );

  const defaultValues = React.useMemo((): FormValues => {
    return {
      displayLabel: '',
      redAthlete: 'direct',
      redSelectionId: '',
      blueAthlete: 'direct',
      blueSelectionId: '',
    };
  }, []);

  const mutation = useCreateCustomMatch();

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: CreateCustomMatchFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!groupId || blocked) return;
      const red = buildSlot(value.redAthlete, value.redSelectionId);
      const blue = buildSlot(value.blueAthlete, value.blueSelectionId);
      if (!red || !blue) return;
      const payload: CreateCustomMatchDTO = {
        groupId,
        displayLabel: value.displayLabel.trim(),
        red,
        blue,
      };
      try {
        await mutation.mutateAsync(payload);
        form.reset(defaultValues);
        onOpenChange(false);
      } catch {
        // Error toast is handled by useCreateCustomMatch
      }
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
  }, [open, groupId, defaultValues, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) form.reset(defaultValues);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (blocked) return;
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <DialogHeader className="gap-0">
            <DialogTitle className="text-lg">Custom match</DialogTitle>
            <DialogDescription>
              Exhibition bout in this group. Does not advance the elimination
              bracket.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4 py-2">
            <form.Subscribe
              selector={(s) => s.values.redAthlete}
              children={(redAthlete) => (
                <AthleteSelectionSync
                  form={form}
                  mode={redAthlete}
                  selectionField="redSelectionId"
                />
              )}
            />
            <form.Subscribe
              selector={(s) => s.values.blueAthlete}
              children={(blueAthlete) => (
                <AthleteSelectionSync
                  form={form}
                  mode={blueAthlete}
                  selectionField="blueSelectionId"
                />
              )}
            />
            <form.Subscribe
              selector={(s) => ({
                redAthlete: s.values.redAthlete,
                redSelectionId: s.values.redSelectionId,
                blueAthlete: s.values.blueAthlete,
                blueSelectionId: s.values.blueSelectionId,
              })}
              children={(corners) => (
                <DedupeAthleteSelection form={form} {...corners} />
              )}
            />

            <form.AppField name="displayLabel">
              {(field) => (
                <field.Input
                  label="Label"
                  description="Must be unique for this tournament."
                  descPosition="after-field"
                  placeholder="e.g. Exhibition A"
                  maxLength={120}
                  disabled={blocked}
                />
              )}
            </form.AppField>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-md border-2 border-dashed p-3">
                <Label className="text-destructive font-medium">
                  Red athlete
                </Label>
                <form.AppField name="redAthlete">
                  {(field) => (
                    <field.Select
                      label="Source"
                      placeholder="Source"
                      className="w-full"
                      disabled={blocked}
                    >
                      <SelectItem value="direct">Athlete (direct)</SelectItem>
                      <SelectItem value="winner">Winner of match</SelectItem>
                      <SelectItem value="loser">Loser of match</SelectItem>
                    </field.Select>
                  )}
                </form.AppField>
                <form.Subscribe
                  selector={(s) => s.values.redAthlete}
                  children={(redAthlete) =>
                    redAthlete === 'direct' ? (
                      <form.AppField name="redSelectionId">
                        {(field) => (
                          <field.Select
                            label="Athlete"
                            placeholder="Select athlete"
                            className="w-full"
                            disabled={blocked}
                          >
                            {athleteList.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </field.Select>
                        )}
                      </form.AppField>
                    ) : (
                      <form.AppField name="redSelectionId">
                        {(field) => (
                          <field.Select
                            label="Feeder match"
                            placeholder="Select match"
                            className="w-full"
                            disabled={blocked}
                          >
                            {(redAthlete === 'loser'
                              ? feederLoserOptions
                              : feederWinnerOptions
                            ).map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {matchOptionLabel(m, matchLabel)}
                              </SelectItem>
                            ))}
                          </field.Select>
                        )}
                      </form.AppField>
                    )
                  }
                />
              </div>

              <div className="space-y-3 rounded-md border-2 border-dashed p-3">
                <Label className="font-medium text-blue-500">
                  Blue athlete
                </Label>
                <form.AppField name="blueAthlete">
                  {(field) => (
                    <field.Select
                      label="Source"
                      placeholder="Source"
                      className="w-full"
                      disabled={blocked}
                    >
                      <SelectItem value="direct">Athlete (direct)</SelectItem>
                      <SelectItem value="winner">Winner of match</SelectItem>
                      <SelectItem value="loser">Loser of match</SelectItem>
                    </field.Select>
                  )}
                </form.AppField>
                <form.Subscribe
                  selector={(s) => s.values.blueAthlete}
                  children={(blueAthlete) =>
                    blueAthlete === 'direct' ? (
                      <form.AppField name="blueSelectionId">
                        {(field) => (
                          <field.Select
                            label="Athlete"
                            placeholder="Select athlete"
                            className="w-full"
                            disabled={blocked}
                          >
                            {athleteList.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </field.Select>
                        )}
                      </form.AppField>
                    ) : (
                      <form.AppField name="blueSelectionId">
                        {(field) => (
                          <field.Select
                            label="Feeder match"
                            placeholder="Select match"
                            className="w-full"
                            disabled={blocked}
                          >
                            {(blueAthlete === 'loser'
                              ? feederLoserOptions
                              : feederWinnerOptions
                            ).map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {matchOptionLabel(m, matchLabel)}
                              </SelectItem>
                            ))}
                          </field.Select>
                        )}
                      </form.AppField>
                    )
                  }
                />
              </div>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={
                    blocked || !canSubmit || isSubmitting || mutation.isPending
                  }
                >
                  {isSubmitting || mutation.isPending ? (
                    <>
                      <Spinner className="text-primary-foreground" />
                      <span>Creating…</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Create
                    </>
                  )}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
