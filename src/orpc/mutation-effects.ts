import { recordTournamentActivity } from './activity/dal';
import type { ActivityDatabase, ActivityInput } from './activity/types';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-realtime-broadcast';

export async function recordMutationActivity(
  input: ActivityInput,
  db?: ActivityDatabase
) {
  return recordTournamentActivity(input, db);
}

export function publishTournamentMutation(tournamentId: string) {
  publishSelectionInvalidate(tournamentId);
}
