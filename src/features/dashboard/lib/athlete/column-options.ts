import type { AthleteProfileData } from '@/contracts/athlete/profile';
import type { DataTableRowAction } from '@/types/data-table';

export type ColumnOptions = {
  onRowAction: (action: DataTableRowAction<AthleteProfileData>) => void;
  nameFilterQueryKey?: 'name' | 'query';
};
