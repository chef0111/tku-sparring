import * as React from 'react';
import type { CustomSlotDTO } from '@/orpc/matches/dto';
import type { MatchData } from '@/features/dashboard/types';
import type { CreateCustomMatchFormValues } from '@/lib/validations';
import { formatArenaMatchTitle } from '@/lib/tournament/arena-match-label';
import { customMatchCornersUseSameSource } from '@/lib/validations';

type SlotMode = CreateCustomMatchFormValues['redAthlete'];

export type FormSetSelectionApi = {
  setFieldValue: (
    name: keyof CreateCustomMatchFormValues,
    value: string
  ) => void;
};

export function matchOptionLabel(
  m: MatchData,
  matchLabel: Map<string, number | null>
): string {
  const n = matchLabel.get(m.id);
  const title =
    n != null ? formatArenaMatchTitle(n) : `Match ${m.id.slice(-6)}`;
  return title;
}

export function buildSlot(
  mode: SlotMode,
  selectionId: string
): CustomSlotDTO | null {
  const id = selectionId.trim();
  if (!id) return null;
  if (mode === 'direct') return { mode: 'direct', tournamentAthleteId: id };
  if (mode === 'winner') return { mode: 'winner', feederMatchId: id };
  return { mode: 'loser', feederMatchId: id };
}

export function AthleteSelectionSync({
  form,
  mode,
  selectionField,
}: {
  form: FormSetSelectionApi;
  mode: string;
  selectionField: 'redSelectionId' | 'blueSelectionId';
}) {
  const prev = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (prev.current !== null && prev.current !== mode) {
      form.setFieldValue(selectionField, '');
    }
    prev.current = mode;
  }, [mode, form, selectionField]);
  return null;
}

export function DedupeAthleteSelection({
  form,
  redAthlete,
  redSelectionId,
  blueAthlete,
  blueSelectionId,
}: {
  form: FormSetSelectionApi;
  redAthlete: SlotMode;
  redSelectionId: string;
  blueAthlete: SlotMode;
  blueSelectionId: string;
}) {
  React.useEffect(() => {
    if (
      customMatchCornersUseSameSource({
        redAthlete,
        blueAthlete,
        redSelectionId,
        blueSelectionId,
      })
    ) {
      form.setFieldValue('redSelectionId', '');
    }
  }, [form, redAthlete, redSelectionId, blueAthlete, blueSelectionId]);

  return null;
}
