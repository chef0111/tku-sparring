import type { DataTableRowAction } from '@/types/data-table';

export interface AthleteProfileData {
  id: string;
  athleteCode: string;
  name: string;
  gender: string;
  beltLevel: number;
  weight: number;
  affiliation: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AthleteRow = {
  id: string;
  athleteCode: string;
  name: string;
  gender: 'M' | 'F';
  beltLevel: number;
  weight: number;
  affiliation: string;
};

export type ColumnOptions = {
  onRowAction: (action: DataTableRowAction<AthleteProfileData>) => void;
  nameFilterQueryKey?: 'name' | 'query';
};
