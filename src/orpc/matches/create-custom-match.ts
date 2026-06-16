import { assertLabelAvailable } from './custom-match-label';
import { resolveCustomSlot } from './custom-match-slots';
import { throwMatchBadRequest } from './match-domain-error';
import { coalesceMatchRead } from './match-read';
import type { CreateCustomMatchDTO } from './dto';
import { assertTournamentAction } from '@/orpc/policies/tournament-policy';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { prisma } from '@/lib/db';

const MATCH_CUSTOM_ROUND = 900;

export async function createCustomMatch(
  input: CreateCustomMatchDTO,
  adminId: string
) {
  const result = await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: input.groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throwMatchBadRequest('Group not found');
    assertTournamentAction(group.tournament.status, 'match.custom.create');

    const displayLabel = input.displayLabel.trim();
    await assertLabelAvailable({
      tournamentId: group.tournamentId,
      groupId: input.groupId,
      displayLabel,
    });

    const red = await resolveCustomSlot(input.groupId, input.red, tx);
    const blue = await resolveCustomSlot(input.groupId, input.blue, tx);

    if (red.tournamentAthleteId === blue.tournamentAthleteId) {
      throwMatchBadRequest('Red and blue cannot be the same athlete');
    }

    const idxAgg = await tx.match.aggregate({
      where: { groupId: input.groupId, round: MATCH_CUSTOM_ROUND },
      _max: { matchIndex: true },
    });
    const nextMatchIndex = (idxAgg._max.matchIndex ?? -1) + 1;

    const row = await tx.match.create({
      data: {
        kind: 'custom',
        displayLabel,
        groupId: input.groupId,
        tournamentId: group.tournamentId,
        round: MATCH_CUSTOM_ROUND,
        matchIndex: nextMatchIndex,
        status: 'pending',
        redTournamentAthleteId: red.tournamentAthleteId,
        blueTournamentAthleteId: blue.tournamentAthleteId,
        redAthleteId: red.athleteProfileId,
        blueAthleteId: blue.athleteProfileId,
        redWins: 0,
        blueWins: 0,
        redLocked: false,
        blueLocked: false,
      },
    });

    await recordMutationActivity(
      {
        tournamentId: group.tournamentId,
        adminId,
        eventType: 'match.create_custom',
        entityType: 'match',
        entityId: row.id,
        payload: { groupId: input.groupId, displayLabel },
      },
      tx
    );

    return { row, tournamentId: group.tournamentId };
  });

  publishTournamentMutation(result.tournamentId);
  return coalesceMatchRead(result.row);
}
