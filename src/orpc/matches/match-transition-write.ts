import { advanceWinner, clearWinnerAdvancement } from './match-progression';
import { coalesceMatchRead } from './match-read';
import type { MatchTransitionPlan } from '@/lib/tournament/match-transition';
import type { ActivityInput } from '@/orpc/activity/types';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { prisma } from '@/lib/db';

export async function applyMatchTransition(input: {
  matchId: string;
  plan: MatchTransitionPlan;
  adminId: string;
  activity: {
    eventType: ActivityInput['eventType'];
    payload?: ActivityInput['payload'];
  };
}) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: input.matchId } });
    if (!match) throw new Error('Match not found');

    if (input.plan.clearAdvancement) {
      await clearWinnerAdvancement(match, tx);
    }

    const updated = await tx.match.update({
      where: { id: input.matchId },
      data: input.plan.data,
    });

    if (input.plan.advancedWinnerId) {
      await advanceWinner(input.matchId, input.plan.advancedWinnerId, tx);
    }

    await recordMutationActivity(
      {
        tournamentId: match.tournamentId,
        adminId: input.adminId,
        eventType: input.activity.eventType,
        entityType: 'match',
        entityId: input.matchId,
        payload: input.activity.payload,
      },
      tx
    );

    return { updated, tournamentId: match.tournamentId };
  });

  publishTournamentMutation(result.tournamentId);
  return coalesceMatchRead(result.updated);
}
