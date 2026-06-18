import type {
  MatchLoadRow,
  MatchRead,
} from '@/server/domain/tournament/match/match-read';
import type { MutationActivityInput } from '@/server/application/activity/activity-types';
import type { SwapParticipantsCommand } from '../use-cases/swap-participants-commands';

export type MatchParticipantStore = {
  findMatch: (matchId: string) => Promise<MatchLoadRow | null>;
  swap: (input: {
    command: SwapParticipantsCommand;
    activity: MutationActivityInput;
  }) => Promise<MatchRead>;
};
