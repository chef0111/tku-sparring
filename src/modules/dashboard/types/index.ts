export interface TournamentData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  groups: Array<{
    id: string;
    name: string;
    _count: { athletes: number; matches: number };
  }>;
  _count: { groups: number; matches: number; athletes: number };
}

export interface GroupData {
  id: string;
  name: string;
  _count: { athletes: number; matches: number };
}

export interface TournamentListItem {
  id: string;
  name: string;
  createdAt: Date;
  _count: { groups: number; matches: number; athletes: number };
}

export interface AthleteData {
  id: string;
  name: string;
  beltLevel: string;
  weight: number;
  affiliation: string;
  groupId: string;
  tournamentId: string;
  createdAt: Date;
  updatedAt: Date;
}
