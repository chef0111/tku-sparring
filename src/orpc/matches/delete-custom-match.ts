import { coalesceMatchRead } from './match-read';
import { badRequest, notFound } from '@/orpc/errors';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { prisma } from '@/lib/db';
import { assertTournamentAction } from '@/orpc/policies/tournament-policy';

export async function deleteCustomMatch(matchId: string, adminId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { status: true } } },
    });
    if (!match) notFound('Match not found');
    if (match.kind !== 'custom') {
      badRequest('Only custom matches can be deleted');
    }

    assertTournamentAction(match.tournament.status, 'match.custom.delete');

    const deleted = await tx.match.delete({ where: { id: matchId } });

    await recordMutationActivity(
      {
        tournamentId: match.tournamentId,
        adminId,
        eventType: 'match.delete_custom',
        entityType: 'match',
        entityId: matchId,
        payload: {
          groupId: match.groupId,
          displayLabel: match.displayLabel,
        },
      },
      tx
    );

    return { deleted, tournamentId: match.tournamentId };
  });

  publishTournamentMutation(result.tournamentId);
  return coalesceMatchRead(result.deleted);
}
