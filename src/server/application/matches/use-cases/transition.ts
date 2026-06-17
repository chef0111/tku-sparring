import type {
  AdminSetMatchStatusCommand,
  SetMatchWinnerCommand,
  UpdateMatchScoreCommand,
} from './commands';
import type { MatchTransitionStore } from '../repositories/transition';
import {
  buildAdminStatusPlan,
  buildScoreTransitionPlan,
  buildWinnerOverridePlan,
} from '@/lib/tournament/match-transition';
import { MatchStatusSchema } from '@/lib/tournament/match-status';
import { notFound } from '@/orpc/errors';
import { assertTournamentAction } from '@/orpc/policies/tournament-policy';

// TODO: Move application errors and lifecycle policy behind server-layer
// boundaries after the oRPC error-boundary and policy migration plans land.

export async function updateMatchScore(
  command: UpdateMatchScoreCommand,
  store: MatchTransitionStore
) {
  const match = await store.findMatch(command.matchId);
  if (!match) notFound('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.score');

  const plan = buildScoreTransitionPlan({
    match,
    redWins: command.redWins,
    blueWins: command.blueWins,
  });

  return store.applyTransition({
    matchId: command.matchId,
    plan,
    adminId: command.adminId,
    activity: {
      eventType: 'match.score_edit',
      payload: {
        redWins: command.redWins,
        blueWins: command.blueWins,
        status: plan.data.status,
      },
    },
  });
}

export async function setMatchWinner(
  command: SetMatchWinnerCommand,
  store: MatchTransitionStore
) {
  const match = await store.findMatch(command.matchId);
  if (!match) notFound('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.score');

  const plan = buildWinnerOverridePlan({
    match,
    winnerSide: command.winnerSide,
  });

  return store.applyTransition({
    matchId: command.matchId,
    plan,
    adminId: command.adminId,
    activity: {
      eventType: 'match.winner_override',
      payload: {
        winnerSide: command.winnerSide,
        reason: command.reason,
      },
    },
  });
}

export async function adminSetMatchStatus(
  command: AdminSetMatchStatusCommand,
  store: MatchTransitionStore
) {
  const match = await store.findMatch(command.matchId);
  if (!match) notFound('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.score');

  const current = MatchStatusSchema.parse(match.status);
  const plan = buildAdminStatusPlan({ match, status: command.status });

  return store.applyTransition({
    matchId: command.matchId,
    plan,
    adminId: command.adminId,
    activity: {
      eventType: 'match.status_admin',
      payload: {
        fromStatus: current,
        toStatus: command.status,
        clearedScores: plan.clearedScores,
      },
    },
  });
}
