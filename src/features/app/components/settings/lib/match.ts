import type { SelectionMatchRow } from '@/orpc/advance-settings/dal';

export type MatchComboboxStatusVariant =
  | 'online'
  | 'offline'
  | 'maintenance'
  | 'degraded';

export function resolveMatchComboboxRow(
  row: SelectionMatchRow,
  selectedMatchId: string | null | undefined
): {
  status: MatchComboboxStatusVariant;
  statusLabel: string;
} {
  if (row.claimStatus === 'held_by_other') {
    return { status: 'degraded', statusLabel: 'Busy' };
  }
  if (row.claimStatus === 'held_by_me') {
    return { status: 'online', statusLabel: 'Active' };
  }
  const sel = selectedMatchId?.trim();
  if (sel && row.id === sel) {
    return { status: 'online', statusLabel: 'Active' };
  }
  return { status: 'maintenance', statusLabel: 'Available' };
}
