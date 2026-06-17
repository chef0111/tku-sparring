import type { MutationActivityInput } from '@/server/application/activity/activity-types';
import type { CreateCustomMatchCommand } from '../use-cases/custom-commands';

export type CustomMatchGroupContext = {
  id: string;
  tournamentId: string;
  tournamentStatus: string;
};

export type CustomMatchDeleteContext = {
  id: string;
  kind: string;
  displayLabel: string | null;
  groupId: string;
  tournamentId: string;
  tournamentStatus: string;
};

export type CustomMatchResult = {
  id: string;
  kind: string;
  displayLabel: string | null;
  groupId: string;
  tournamentId: string;
  round: number;
  matchIndex: number;
  status: string;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redWins: number;
  blueWins: number;
  winnerId: string | null;
  tournamentWinnerId: string | null;
  redLocked: boolean;
  blueLocked: boolean;
  cornersSwapped: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomMatchStore = {
  findGroup: (groupId: string) => Promise<CustomMatchGroupContext | null>;
  findForDelete: (matchId: string) => Promise<CustomMatchDeleteContext | null>;
  create: (input: {
    command: CreateCustomMatchCommand;
    group: CustomMatchGroupContext;
    activity: MutationActivityInput;
  }) => Promise<CustomMatchResult>;
  delete: (input: {
    matchId: string;
    adminId: string;
    activity: MutationActivityInput;
  }) => Promise<CustomMatchResult>;
};
