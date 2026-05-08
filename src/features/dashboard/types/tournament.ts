export interface TournamentData {
  id: string;
  name: string;
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
  createdAt: Date;
  _count: { groups: number; matches: number; tournamentAthletes: number };
}
