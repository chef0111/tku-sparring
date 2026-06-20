import type {
  TournamentListItemDTO,
  TournamentStatusDTO,
} from '@/orpc/tournaments/dto';

export type TournamentStatus = TournamentStatusDTO;

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

export interface TournamentData {
  id: string;
  name: string;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  lifecycle: {
    canComplete: boolean;
  };
  /** Map of arena index string → ordered division ids (draft arena scheduling). */
  arenaDivisionOrder?: unknown;
  divisions: Array<{
    id: string;
    name: string;
    _count: { tournamentAthletes: number; matches: number };
  }>;
  _count: { divisions: number; matches: number; tournamentAthletes: number };
}

/** List row from `tournament.list` (includes `actionableMatches` on `_count`). */
export type TournamentListItem = TournamentListItemDTO;
