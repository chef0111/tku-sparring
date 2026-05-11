import type { DataTableRowAction } from '@/types/data-table';

export type TournamentStatus = 'draft' | 'active' | 'completed';

export type TournamentSortField =
  | 'name'
  | 'status'
  | 'athletes'
  | 'createdAt'
  | undefined;

export const TOURNAMENT_STATUSES: ReadonlyArray<TournamentStatus> = [
  'draft',
  'active',
  'completed',
];

export interface TournamentRowActionOptions {
  onRowAction: (action: DataTableRowAction<TournamentListItem>) => void;
}

export interface TournamentData {
  id: string;
  name: string;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  groups: Array<{
    id: string;
    name: string;
    _count: { tournamentAthletes: number; matches: number };
  }>;
  _count: { groups: number; matches: number; tournamentAthletes: number };
}

export interface TournamentListItem {
  id: string;
  name: string;
  status: TournamentStatus;
  createdAt: Date;
  _count: { groups: number; matches: number; tournamentAthletes: number };
}
