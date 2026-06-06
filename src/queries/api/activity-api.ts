import type { TournamentActivityEventType } from '@/orpc/activity/types';
import { client } from '@/orpc/client';

export function listTournamentActivity(input: {
  tournamentId: string;
  eventTypes?: Array<TournamentActivityEventType>;
  cursor?: { id: string };
  limit?: number;
}) {
  return client.activity.listForTournament(input);
}
