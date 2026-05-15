import { useEffect, useMemo, useRef } from 'react';
import { IconReload } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';

import { PlayerAvatar } from '../../hud/player-avatar';
import { advancePlayerGroup } from '../constant/form';
import { CommonSettings } from './common-settings';
import { useAdvanceSettingsComboboxState } from './use-advance-settings-combobox-state';
import type { AdvanceSettingsComboboxFormHandle } from './use-advance-settings-combobox-state';
import { useSettings } from '@/contexts/settings';
import { useAppForm } from '@/components/form/hooks';
import { AdvanceSettingsSchema } from '@/lib/validations';
import { FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useDeviceId } from '@/hooks/use-device-id';
import {
  useArenaSelectionCatalog,
  useArenaSelectionMatches,
} from '@/features/app/hooks/use-arena-selection-view';

export const AdvanceSettings = () => {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();
  const { formData, updateAdvanceForm, setAdvanceFormState } = useSettings();
  const { advance } = formData;

  const catalogQuery = useArenaSelectionCatalog({
    deviceId,
    tournamentId: advance.tournament,
    enabled: Boolean(session?.user),
    refetchInterval: false,
  });

  const matchesQuery = useArenaSelectionMatches({
    deviceId,
    tournamentId: advance.tournament,
    groupId: advance.group,
    enabled: Boolean(session?.user),
    refetchInterval: false,
  });

  const formKey = useMemo(
    () =>
      [
        advance.tournament ?? '',
        advance.group ?? '',
        advance.match ?? '',
        advance.matchLabel ?? '',
        deviceId ?? '',
      ].join(':'),
    [
      advance.group,
      advance.match,
      advance.matchLabel,
      advance.tournament,
      deviceId,
    ]
  );

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

  const prevTournamentForCascade = useRef<string | null>(advance.tournament);

  useEffect(() => {
    const t = advance.tournament;
    const prev = prevTournamentForCascade.current;
    if (prev === t) {
      return;
    }
    prevTournamentForCascade.current = t;

    if (prev != null && prev !== t) {
      form.setFieldValue('group', '');
      form.setFieldValue('match', '');
    }
  }, [advance.tournament, form]);

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

  const { tournamentFields, refetchSelection } =
    useAdvanceSettingsComboboxState({
      advance,
      deviceId,
      queryClient,
      catalogQuery,
      matchesQuery,
      form: form as AdvanceSettingsComboboxFormHandle,
      updateAdvanceForm,
    });

  if (sessionPending) {
    return null;
  }

  return (
    <FieldSet key={formKey} className="w-full">
      <FieldGroup className="settings-field-group relative items-center">
        <FieldLabel className="settings-group-label flex w-full items-center">
          <span className="grow text-2xl">TOURNAMENT SETTINGS</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={refetchSelection}
              type="button"
              title="Refresh tournament data"
              aria-label="Refresh tournament data"
              disabled={catalogQuery.isLoading || matchesQuery.isLoading}
            >
              <IconReload />
            </Button>
          </div>
        </FieldLabel>
        {tournamentFields.map((field) => (
          <FieldGroup key={field.name}>
            <form.AppField name={field.name}>
              {(formField) => (
                <formField.Combobox
                  data={field.data}
                  type={field.type}
                  label={field.label}
                  disabled={field.disabled}
                  pending={field.pending}
                  itemClassName="hover:bg-accent! bg-transparent!"
                />
              )}
            </form.AppField>
          </FieldGroup>
        ))}
      </FieldGroup>

      <FieldGroup className="settings-field-group items-center">
        <FieldLabel className="settings-group-label">
          ATHLETE INFORMATION
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
