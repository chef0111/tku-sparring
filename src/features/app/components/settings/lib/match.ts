import type { SelectionMatchRow } from '@/orpc/advance-settings/dal';

export type MatchComboboxStatusVariant =
  | 'online'
  | 'offline'
  | 'maintenance'
  | 'degraded';

export function resolveMatchComboboxRow(row: SelectionMatchRow): {
  status: MatchComboboxStatusVariant;
  statusLabel: string;
} {
  if (row.claimStatus === 'held_by_other') {
    return { status: 'degraded', statusLabel: 'Busy' };
  }
  if (row.claimStatus === 'held_by_me') {
    return { status: 'online', statusLabel: 'Active' };
  }
  return { status: 'maintenance', statusLabel: 'Available' };
}
