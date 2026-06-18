import type { SwapParticipantsCommand } from './swap-participants-commands';
import type { MatchParticipantStore } from '../repositories/swap-participants';
import { NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function swapParticipants(
  command: SwapParticipantsCommand,
  store: MatchParticipantStore
) {
  const match = await store.findMatch(command.matchId);
  if (!match) throw new NotFoundError('Match not found');
  assertTournamentAction(match.tournamentStatus, 'match.slot.edit');

  return store.swap({
    command,
    activity: {
      eventType: 'match.swap_participants',
      payload: {
        previousRedAthleteId: match.redTournamentAthleteId,
        previousBlueAthleteId: match.blueTournamentAthleteId,
        redTournamentAthleteId: command.redTournamentAthleteId,
        blueTournamentAthleteId: command.blueTournamentAthleteId,
      },
    },
  });
}
