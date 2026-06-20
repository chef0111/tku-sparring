import type { SelectionDivisionRow } from '@/contracts/advance/selection';

export type DivisionComboboxStatusVariant =
  | 'online'
  | 'offline'
  | 'maintenance';

export function resolveDivisionComboboxStatus(
  division: SelectionDivisionRow,
  selectedDivisionId: string | null | undefined
): DivisionComboboxStatusVariant {
  if (division.status === 'completed') {
    return 'offline';
  }
  if (selectedDivisionId && division.id === selectedDivisionId) {
    return 'online';
  }
  return 'maintenance';
}
