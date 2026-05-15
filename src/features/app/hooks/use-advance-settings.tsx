import { useCallback, useEffect, useMemo } from 'react';

import { getTournamentFields } from '../components/settings/constant/form';
import { resolveGroupComboboxStatus } from '../components/settings/lib/group';
import { resolveMatchComboboxRow } from '../components/settings/lib/match';
import type { QueryClient, UseQueryResult } from '@tanstack/react-query';
import type { AdvanceFormData } from '@/contexts/settings/context';
import type {
  SelectionGroupRow,
  SelectionMatchRow,
} from '@/orpc/advance-settings/dal';
import {
  arenaSelectionCatalogQueryOptions,
  arenaSelectionMatchesQueryOptions,
} from '@/features/app/hooks/use-arena-selection-view';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';

type ArenaSelectionCatalogData = {
  tournaments: Array<{ id: string; name: string }>;
  groups: Array<SelectionGroupRow>;
};

type ArenaSelectionMatchesData = {
  matches: Array<SelectionMatchRow>;
};

export type AdvanceSettingsComboboxFormHandle = {
  getFieldValue: (name: 'redPlayerName' | 'bluePlayerName') => unknown;
  setFieldValue: (
    name: 'redPlayerName' | 'bluePlayerName',
    value: unknown
  ) => void;
};

const GROUP_STATUS_TEXT: Record<
  ReturnType<typeof resolveGroupComboboxStatus>,
  string
> = {
  online: 'Selected',
  offline: 'Finished',
  maintenance: 'Open',
};

function tournamentsFromCatalogCaches(
  queryClient: QueryClient,
  deviceId: string | undefined,
  primary: ArenaSelectionCatalogData | undefined
): Array<{ id: string; name: string }> {
  if (primary?.tournaments?.length) {
    return primary.tournaments;
  }
  const entries = queryClient.getQueriesData<ArenaSelectionCatalogData>({
    queryKey: ['advanceSettings', 'selectionCatalog', deviceId ?? null],
  });
  for (const [, data] of entries) {
    if (data?.tournaments?.length) {
      return data.tournaments;
    }
  }
  return [];
}

export function useAdvanceSettings(args: {
  advance: AdvanceFormData;
  deviceId: string | undefined;
  queryClient: QueryClient;
  catalogQuery: UseQueryResult<ArenaSelectionCatalogData, Error>;
  matchesQuery: UseQueryResult<ArenaSelectionMatchesData, Error>;
  form: AdvanceSettingsComboboxFormHandle;
  updateAdvanceForm: (data: Partial<AdvanceFormData>) => void;
}) {
  const {
    advance,
    deviceId,
    queryClient,
    catalogQuery,
    matchesQuery,
    form,
    updateAdvanceForm,
  } = args;

  useEffect(() => {
    const id = advance.match?.trim() || null;
    const rows = matchesQuery.data?.matches;
    let nextLabel: string | null = null;
    if (id && rows?.length) {
      nextLabel = rows.find((m) => m.id === id)?.label ?? null;
    }
    if (nextLabel === advance.matchLabel) {
      return;
    }
    updateAdvanceForm({ matchLabel: nextLabel });
  }, [
    advance.match,
    advance.matchLabel,
    matchesQuery.data?.matches,
    updateAdvanceForm,
  ]);

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

  const tournamentRows = useMemo(
    () =>
      tournamentsFromCatalogCaches(queryClient, deviceId, catalogQuery.data),
    [catalogQuery.data, deviceId, queryClient]
  );

  const tournamentOptions = useMemo(
    () =>
      tournamentRows.map((t) => ({
        value: t.id,
        label: t.name,
        triggerLabel: t.name,
      })),
    [tournamentRows]
  );

  const groupOptions = useMemo(
    () =>
      (catalogQuery.data?.groups ?? []).map((g) => {
        const st = resolveGroupComboboxStatus(g, advance.group);
        return {
          value: g.id,
          triggerLabel: g.name,
          label: (
            <span className="flex w-full min-w-0 items-center justify-between gap-2">
              <span className="truncate">{g.name}</span>
              <Status status={st} className="-mr-6">
                <StatusIndicator />
                <StatusLabel className="truncate">
                  {GROUP_STATUS_TEXT[st]}
                </StatusLabel>
              </Status>
            </span>
          ),
        };
      }),
    [advance.group, catalogQuery.data?.groups]
  );

  const matchOptions = useMemo(
    () =>
      (matchesQuery.data?.matches ?? []).map((m) => {
        const rowUi = resolveMatchComboboxRow(m);
        return {
          value: m.id,
          triggerLabel: m.label,
          label: (
            <span className="flex w-full items-center justify-between gap-2">
              <span className="truncate">{m.label}</span>
              <Status status={rowUi.status} className="-mr-6">
                <StatusIndicator />
                <StatusLabel className="truncate">
                  {rowUi.statusLabel}
                </StatusLabel>
              </Status>
            </span>
          ),
          disabled: m.disabled,
        };
      }),
    [matchesQuery.data?.matches]
  );

  const groupsDisabled = !advance.tournament;
  const matchesDisabled = !advance.group;

  const groupComboboxPending =
    Boolean(advance.tournament) &&
    catalogQuery.isFetching &&
    !catalogQuery.data;
  const matchComboboxPending =
    Boolean(advance.group) && matchesQuery.isFetching && !matchesQuery.data;

  const tournamentFields = useMemo(
    () =>
      getTournamentFields(
        tournamentOptions,
        groupOptions,
        matchOptions,
        groupsDisabled,
        matchesDisabled,
        { group: groupComboboxPending, match: matchComboboxPending }
      ),
    [
      groupComboboxPending,
      groupOptions,
      groupsDisabled,
      matchComboboxPending,
      matchOptions,
      matchesDisabled,
      tournamentOptions,
    ]
  );

  const refetchSelection = useCallback(() => {
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
  }, [advance.group, advance.tournament, deviceId, queryClient]);

  return { tournamentFields, refetchSelection };
}
