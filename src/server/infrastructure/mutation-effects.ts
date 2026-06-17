import type { ActivityDatabase, ActivityInput } from '@/orpc/activity/types';
import { recordTournamentActivity } from '@/orpc/activity/dal';
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
