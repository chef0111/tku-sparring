import { useCallback, useEffect, useMemo } from 'react';

import { getTournamentFields } from '../components/settings/constant/form';
import type { QueryClient, UseQueryResult } from '@tanstack/react-query';
import type { AdvanceFormData } from '@/features/app/contexts/settings/context';
import type {
  SelectionDivisionRow,
  SelectionMatchRow,
} from '@/contracts/advance/selection';
import { resolveMatchComboboxRow } from '@/features/app/lib/settings/match';
import { resolveDivisionComboboxStatus } from '@/features/app/lib/settings/division';
import {
  arenaSelectionCatalogQueryOptions,
  arenaSelectionMatchesQueryOptions,
} from '@/queries/advance-settings/arena-selection-query-options';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';

type ArenaSelectionCatalogData = {
  tournaments: Array<{ id: string; name: string }>;
  divisions: Array<SelectionDivisionRow>;
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

const DIVISION_STATUS_TEXT: Record<
  ReturnType<typeof resolveDivisionComboboxStatus>,
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
    const matchId = advance.match?.trim();
    if (!matchId) {
      if (advance.redPlayerAvatar != null || advance.bluePlayerAvatar != null) {
        updateAdvanceForm({
          redPlayerAvatar: null,
          bluePlayerAvatar: null,
        });
      }
      return;
    }

    const rows = matchesQuery.data?.matches;
    if (!rows) {
      return;
    }
    const row = rows.find((m) => m.id === matchId);
    if (!row) {
      return;
    }
    const red = row.redAthleteName ?? 'RED';
    const blue = row.blueAthleteName ?? 'BLUE';
    const redImg = row.redAthleteImage ?? null;
    const blueImg = row.blueAthleteImage ?? null;
    if (
      advance.redPlayerName === red &&
      advance.bluePlayerName === blue &&
      advance.redPlayerAvatar === redImg &&
      advance.bluePlayerAvatar === blueImg &&
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
      redPlayerAvatar: redImg,
      bluePlayerAvatar: blueImg,
    });
  }, [
    advance.bluePlayerAvatar,
    advance.bluePlayerName,
    advance.match,
    advance.redPlayerAvatar,
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

  const divisionOptions = useMemo(
    () =>
      (catalogQuery.data?.divisions ?? []).map((division) => {
        const st = resolveDivisionComboboxStatus(division, advance.division);
        return {
          value: division.id,
          triggerLabel: division.name,
          label: (
            <span className="flex w-full min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                <span className="font-medium">{division.name}</span>
                <span className="text-muted-foreground font-normal">
                  {' '}
                  — {division.arenaLabel}
                </span>
              </span>
              <div className="flex items-center">
                <span className="text-muted-foreground text-xs">
                  {division.id}
                </span>
                <Status status={st} className="-mr-6">
                  <StatusIndicator />
                  <StatusLabel className="truncate">
                    {DIVISION_STATUS_TEXT[st]}
                  </StatusLabel>
                </Status>
              </div>
            </span>
          ),
        };
      }),
    [advance.division, catalogQuery.data?.divisions]
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

  const divisionsDisabled = !advance.tournament;
  const matchesDisabled = !advance.division;

  const divisionComboboxPending =
    Boolean(advance.tournament) &&
    catalogQuery.isFetching &&
    !catalogQuery.data;
  const matchComboboxPending =
    Boolean(advance.division) && matchesQuery.isFetching && !matchesQuery.data;

  const tournamentFields = useMemo(
    () =>
      getTournamentFields(
        tournamentOptions,
        divisionOptions,
        matchOptions,
        divisionsDisabled,
        matchesDisabled,
        { division: divisionComboboxPending, match: matchComboboxPending }
      ),
    [
      divisionComboboxPending,
      divisionOptions,
      divisionsDisabled,
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
    if (
      deviceId &&
      advance.tournament &&
      advance.tournament.length > 0 &&
      advance.division &&
      advance.division.length > 0
    ) {
      void queryClient.invalidateQueries({
        queryKey: arenaSelectionMatchesQueryOptions({
          deviceId,
          tournamentId: advance.tournament,
          divisionId: advance.division,
        }).queryKey,
      });
    }
  }, [advance.division, advance.tournament, deviceId, queryClient]);

  return { tournamentFields, refetchSelection };
}
