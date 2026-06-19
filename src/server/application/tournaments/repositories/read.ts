import type { TournamentStatusValue } from '@/lib/tournament/tournament-status';

export type ListTournamentsQuery = {
  page?: number;
  perPage?: number;
  query?: string;
  name?: string;
  status?: Array<TournamentStatusValue>;
  sort?: 'name' | 'status' | 'athletes' | 'createdAt';
  sortDir?: 'asc' | 'desc';
};

export type TournamentLifecycleFlags = {
  canComplete: boolean;
};

export type TournamentGroupSummary = {
  id: string;
  name: string;
  _count: { tournamentAthletes: number; matches: number };
};

export type TournamentDetail = {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  nameSortKey: string;
  arenaGroupOrder: unknown;
  groups: Array<TournamentGroupSummary>;
  _count: { groups: number; matches: number; tournamentAthletes: number };
  lifecycle: TournamentLifecycleFlags;
};

export type TournamentListItem = {
  id: string;
  name: string;
  status: TournamentStatusValue;
  createdAt: Date;
  updatedAt: Date;
  nameSortKey: string;
  arenaGroupOrder: unknown;
  _count: {
    groups: number;
    matches: number;
    tournamentAthletes: number;
    actionableMatches: number;
  };
};

export type TournamentsPage = {
  items: Array<TournamentListItem>;
  total: number;
};

export type TournamentReadStore = {
  findWithLifecycle: (id: string) => Promise<TournamentDetail | null>;
  findById: (id: string) => Promise<TournamentDetail | null>;
  list: (query: ListTournamentsQuery) => Promise<TournamentsPage>;
};
