import { client } from '@/orpc/client';

export function listMatchesByGroup(groupId: string) {
  return client.match.list({ groupId });
}

export function listMatchesByTournament(tournamentId: string) {
  return client.match.list({ tournamentId });
}
