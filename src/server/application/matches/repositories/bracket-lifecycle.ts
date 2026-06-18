import type { MatchRead } from '@/server/domain/tournament/match/match-read';
import type { MutationActivityInput } from '@/server/application/activity/activity-types';
import type {
  GenerateBracketCommand,
  GroupBracketCommand,
} from '../use-cases/bracket-lifecycle-commands';

export type BracketGroupContext = {
  id: string;
  tournamentId: string;
  tournamentStatus: string;
  thirdPlaceMatch: boolean;
  round0Baseline: unknown;
};

export type BracketLifecycleStore = {
  findGroup: (groupId: string) => Promise<BracketGroupContext | null>;
  countBracketMatches: (groupId: string) => Promise<number>;
  generate: (input: {
    command: GenerateBracketCommand;
    group: BracketGroupContext;
    activity: MutationActivityInput;
  }) => Promise<Array<MatchRead>>;
  shuffle: (input: {
    command: GroupBracketCommand;
    group: BracketGroupContext;
    activity: MutationActivityInput;
  }) => Promise<Array<MatchRead>>;
  reset: (input: {
    command: GroupBracketCommand;
    group: BracketGroupContext;
    activity: MutationActivityInput;
  }) => Promise<Array<MatchRead>>;
  regenerate: (input: {
    command: GroupBracketCommand;
    group: BracketGroupContext;
    activity: MutationActivityInput;
  }) => Promise<Array<MatchRead>>;
};
