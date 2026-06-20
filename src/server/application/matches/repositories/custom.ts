import type { MatchRead } from '@/server/domain/tournament/match/match-read';
import type { MutationActivityInput } from '@/server/application/activity/activity-types';
import type { CreateCustomMatchCommand } from '../use-cases/custom-commands';

export type CustomMatchDivisionContext = {
  id: string;
  tournamentId: string;
  tournamentStatus: string;
};

export type CustomMatchDeleteContext = {
  id: string;
  kind: string;
  displayLabel: string | null;
  divisionId: string;
  tournamentId: string;
  tournamentStatus: string;
};

export type CustomMatchResult = MatchRead;

export type CustomMatchStore = {
  findDivision: (
    divisionId: string
  ) => Promise<CustomMatchDivisionContext | null>;
  findForDelete: (matchId: string) => Promise<CustomMatchDeleteContext | null>;
  create: (input: {
    command: CreateCustomMatchCommand;
    group: CustomMatchDivisionContext;
    activity: MutationActivityInput;
  }) => Promise<CustomMatchResult>;
  delete: (input: {
    matchId: string;
    adminId: string;
    activity: MutationActivityInput;
  }) => Promise<CustomMatchResult>;
};
