import { client } from '@/orpc/client';

export function listGroups(tournamentId: string) {
  return client.group.list({ tournamentId });
}
