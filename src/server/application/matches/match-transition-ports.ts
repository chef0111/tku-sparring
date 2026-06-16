import type { MatchTransitionPlan } from '@/lib/tournament/match-transition';
import type { MutationActivityInput } from '@/server/application/activity/activity-types';

export type MatchTransitionRow = {
  id: string;
  kind: string;
  displayLabel: string | null;
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
  groupId: string;
  tournamentId: string;
  tournamentStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MatchTransitionResult = Omit<
  MatchTransitionRow,
  'tournamentStatus'
>;

export type MatchTransitionStore = {
  findMatch: (matchId: string) => Promise<MatchTransitionRow | null>;
  applyTransition: (input: {
    matchId: string;
    plan: MatchTransitionPlan;
    adminId: string;
    activity: MutationActivityInput;
  }) => Promise<MatchTransitionResult>;
};
