import type { MatchRead } from '@/lib/tournament/match-read';
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

export type CustomMatchResult = MatchRead;

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
