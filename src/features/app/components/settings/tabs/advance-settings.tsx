import { useEffect, useMemo } from 'react';
import { IconReload } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { PlayerAvatar } from '../../hud/player-avatar';
import { advancePlayerGroup, getTournamentFields } from '../constant/form';
import { CommonSettings } from './common-settings';
import { useSettings } from '@/contexts/settings';
import { useAppForm } from '@/components/form/hooks';
import { AdvanceSettingsSchema } from '@/lib/validations';
import { FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useDeviceId } from '@/hooks/use-device-id';
import {
  arenaSelectionCatalogQueryOptions,
  arenaSelectionMatchesQueryOptions,
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
  });

  const matchesQuery = useArenaSelectionMatches({
    deviceId,
    tournamentId: advance.tournament,
    groupId: advance.group,
    enabled: Boolean(session?.user),
  });

  const formKey = useMemo(
    () =>
      [
        advance.tournament ?? '',
        advance.group ?? '',
        advance.match ?? '',
        deviceId ?? '',
      ].join(':'),
    [advance.group, advance.match, advance.tournament, deviceId]
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

  useEffect(() => {
    const matchId = advance.match;
    const rows = matchesQuery.data?.matches;
    if (!matchId || !rows) {
      return;
    }
    const row = rows.find((m) => m.id === matchId);
    if (!row) {
      return;
    }
    const red = row.redAthleteName ?? 'RED';
    const blue = row.blueAthleteName ?? 'BLUE';
    if (
      advance.redPlayerName === red &&
      advance.bluePlayerName === blue &&
      form.getFieldValue('redPlayerName') === red &&
      form.getFieldValue('bluePlayerName') === blue
    ) {
      return;
    }
    form.setFieldValue('redPlayerName', red);
    form.setFieldValue('bluePlayerName', blue);
    updateAdvanceForm({
      redPlayerName: red,
      bluePlayerName: blue,
    });
  }, [
    advance.bluePlayerName,
    advance.match,
    advance.redPlayerName,
    form,
    matchesQuery.data?.matches,
    updateAdvanceForm,
  ]);

  const tournamentOptions = useMemo(
    () =>
      (catalogQuery.data?.tournaments ?? []).map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [catalogQuery.data?.tournaments]
  );

  const groupOptions = useMemo(
    () =>
      (catalogQuery.data?.groups ?? []).map((g) => ({
        value: g.id,
        label: g.name,
        disabled: g.leaseStatus === 'held_by_other',
      })),
    [catalogQuery.data?.groups]
  );

  const matchOptions = useMemo(
    () =>
      (matchesQuery.data?.matches ?? []).map((m) => ({
        value: m.id,
        label: m.label,
      })),
    [matchesQuery.data?.matches]
  );

  const groupsDisabled = !advance.tournament;
  const matchesDisabled = !advance.group;

  const tournamentFields = getTournamentFields(
    tournamentOptions,
    groupOptions,
    matchOptions,
    groupsDisabled,
    matchesDisabled
  );

  const refetchSelection = () => {
    void queryClient.invalidateQueries({
      queryKey: arenaSelectionCatalogQueryOptions({
        deviceId,
        tournamentId: advance.tournament,
      }).queryKey,
    });
    void queryClient.invalidateQueries({
      queryKey: arenaSelectionMatchesQueryOptions({
        deviceId,
        tournamentId: advance.tournament,
        groupId: advance.group,
      }).queryKey,
    });
  };

  if (sessionPending) {
    return null;
  }

  return (
    <FieldSet key={formKey} className="w-full">
      <FieldGroup className="settings-field-group relative items-center">
        <FieldLabel className="settings-group-label text-2xl!">
          TOURNAMENT SETTINGS
        </FieldLabel>
        <Button
          variant="outline"
          size="icon-sm"
          className="absolute top-4 right-4"
          onClick={refetchSelection}
          type="button"
          disabled={catalogQuery.isFetching || matchesQuery.isFetching}
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
