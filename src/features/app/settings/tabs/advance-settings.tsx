import { useEffect } from 'react';
import { IconReload } from '@tabler/icons-react';
import { PlayerAvatar } from '../../hud/player-avatar';
import { advancePlayerGroup, getTournamentFields } from '../constant/form';
import { CommonSettings } from './common-settings';
import { useSettings } from '@/contexts/settings';
import { useAppForm } from '@/components/form/hooks';
import { AdvanceSettingsSchema } from '@/lib/validations';
import { FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useGroups, useMatches, useTournaments } from '@/hooks/use-tournaments';

export const AdvanceSettings = () => {
  const { formData, updateAdvanceForm, setAdvanceFormState } = useSettings();
  const { advance } = formData;

  const form = useAppForm({
    defaultValues: {
      tournament: advance.tournament,
      group: advance.group,
      match: advance.match,
      redPlayerAvatar: undefined as File | undefined,
      bluePlayerAvatar: undefined as File | undefined,
      redPlayerName: advance.redPlayerName,
      bluePlayerName: advance.bluePlayerName,
      roundDuration: advance.roundDuration,
      breakDuration: advance.breakDuration,
      maxHealth: advance.maxHealth,
    },
  });

  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      const state = form.store.state;
      const values = state.values;

      updateAdvanceForm({
        tournament: values.tournament,
        group: values.group,
        match: values.match,
        redPlayerName: values.redPlayerName,
        bluePlayerName: values.bluePlayerName,
        roundDuration: values.roundDuration,
        breakDuration: values.breakDuration,
        maxHealth: values.maxHealth,
      });

      const validation = AdvanceSettingsSchema.safeParse(values);
      setAdvanceFormState({
        isDirty: state.isDirty,
        isValid: validation.success,
      });
    });
    return () => subscription.unsubscribe();
  }, [form.store, updateAdvanceForm, setAdvanceFormState]);

  const { data: tournaments, refetch: refetchTournaments } = useTournaments();
  const { data: groups, isDisabled: groupsDisabled } = useGroups(
    advance.tournament
  );
  const { data: matches, isDisabled: matchesDisabled } = useMatches(
    advance.group
  );

  // Convert to ComboboxData format
  const tournamentOptions = tournaments.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));
  const matchOptions = matches.map((m) => ({ value: m.id, label: m.name }));

  const tournamentFields = getTournamentFields(
    tournamentOptions,
    groupOptions,
    matchOptions,
    groupsDisabled,
    matchesDisabled
  );

  return (
    <FieldSet className="w-full">
      <FieldGroup className="settings-field-group relative items-center">
        <FieldLabel className="settings-group-label text-2xl!">
          TOURNAMENT SETTINGS
        </FieldLabel>
        <Button
          variant="outline"
          size="icon-sm"
          className="absolute top-4 right-4"
          onClick={refetchTournaments}
          type="button"
        >
          <IconReload />
        </Button>
        {tournamentFields.map((field) => (
          <FieldGroup key={field.name}>
            <form.AppField name={field.name}>
              {(formField) => (
                <formField.Combobox
                  data={field.data}
                  type={field.type}
                  label={field.label}
                  disabled={field.disabled}
                  itemClassName="hover:bg-accent! bg-transparent!"
                />
              )}
            </form.AppField>
          </FieldGroup>
        ))}
      </FieldGroup>

      <FieldGroup className="settings-field-group items-center">
        <FieldLabel className="settings-group-label">
          ATHELETES INFORMATIONS
        </FieldLabel>
        <FieldGroup className="flex-row">
          {advancePlayerGroup.map((player) => (
            <FieldGroup key={player.nameAvatar} className="avatar-group">
              <FieldGroup className="flex-row items-center">
                <PlayerAvatar
                  name={player.playerName}
                  image={
                    (advance[
                      player.nameAvatar as keyof typeof advance
                    ] as string) || ''
                  }
                  className={player.className}
                  fallback={
                    <img src={player.fallback} alt={player.playerName} />
                  }
                />
                <form.AppField key={player.namePlayer} name={player.namePlayer}>
                  {(field) => (
                    <field.Input
                      label={player.label}
                      defaultValue={
                        (advance[
                          player.namePlayer as keyof typeof advance
                        ] as string) ?? player.playerName
                      }
                      className="h-10 w-full truncate"
                      tooltip={
                        (advance[
                          player.namePlayer as keyof typeof advance
                        ] as string) ?? player.playerName
                      }
                      disabled
                      tooltipSide="bottom"
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </FieldGroup>
          ))}
        </FieldGroup>
      </FieldGroup>

      <CommonSettings form={form} className="items-center" />
    </FieldSet>
  );
};
