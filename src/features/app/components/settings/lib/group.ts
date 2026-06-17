import type { SelectionGroupRow } from '@/orpc/advance-settings/types';

export type GroupComboboxStatusVariant = 'online' | 'offline' | 'maintenance';

export function resolveGroupComboboxStatus(
  g: SelectionGroupRow,
  selectedGroupId: string | null | undefined
): GroupComboboxStatusVariant {
  if (g.status === 'completed') {
    return 'offline';
  }
  if (selectedGroupId && g.id === selectedGroupId) {
    return 'online';
  }
  return 'maintenance';
}
