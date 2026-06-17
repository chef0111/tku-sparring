import type { MatchTransitionPlan } from '@/lib/tournament/match-transition';
import type { MatchLoadRow, MatchRead } from '@/lib/tournament/match-read';
import type { MutationActivityInput } from '@/server/application/activity/activity-types';

export type MatchTransitionRow = MatchLoadRow;
export type MatchTransitionResult = MatchRead;

export type MatchTransitionStore = {
  findMatch: (matchId: string) => Promise<MatchTransitionRow | null>;
  applyTransition: (input: {
    matchId: string;
    plan: MatchTransitionPlan;
    adminId: string;
    activity: MutationActivityInput;
  }) => Promise<MatchTransitionResult>;
};
