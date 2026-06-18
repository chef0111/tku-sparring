import type { TournamentStatusValue } from '@/lib/tournament/tournament-status';

export type CreateTournamentCommand = {
  name: string;
};

export type UpdateTournamentCommand = {
  id: string;
  name: string;
};

export type SetTournamentStatusCommand = {
  id: string;
  status: TournamentStatusValue;
  adminId: string;
  force?: boolean;
};

export type DeleteTournamentCommand = {
  id: string;
  adminId: string;
};
