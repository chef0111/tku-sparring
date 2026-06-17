import type {
  ActivityDatabase,
  ActivityRecordInput,
} from '@/server/application/activity/activity-record';
import { recordTournamentActivity } from '@/server/infrastructure/activity/record';
import { publishSelectionInvalidate } from '@/server/infrastructure/realtime/publish';

export async function recordMutationActivity(
  input: ActivityRecordInput,
  db?: ActivityDatabase
) {
  return recordTournamentActivity(input, db);
}

export function publishTournamentMutation(tournamentId: string) {
  publishSelectionInvalidate(tournamentId);
}
