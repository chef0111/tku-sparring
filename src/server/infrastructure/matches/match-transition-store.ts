import type { MatchTransitionStore } from '@/server/application/matches/match-transition-ports';
import type { Prisma } from '@/generated/prisma/client';
import {
  advanceWinner,
  clearWinnerAdvancement,
} from '@/orpc/matches/match-progression';
import { coalesceMatchRead } from '@/orpc/matches/match-read';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { prisma } from '@/lib/db';

export const matchTransitionStore: MatchTransitionStore = {
  async findMatch(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { status: true } } },
    });
    if (!match) return null;

    const { tournament, ...row } = match;
    return { ...row, tournamentStatus: tournament.status };
  },

  async applyTransition(input) {
    const result = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: input.matchId } });
      if (!match) {
        throw new Error('Match not found');
      }

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
          payload: input.activity.payload as Prisma.InputJsonValue | undefined,
        },
        tx
      );

      return { updated, tournamentId: match.tournamentId };
    });

    publishTournamentMutation(result.tournamentId);
    return coalesceMatchRead(result.updated);
  },
};
