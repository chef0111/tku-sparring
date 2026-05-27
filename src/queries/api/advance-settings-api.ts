import { client } from '@/orpc/client';

export function selectionCatalog(input: {
  deviceId: string;
  tournamentId?: string;
}) {
  return client.advanceSettings.selectionCatalog(input);
}

export function selectionMatches(input: {
  deviceId: string;
  tournamentId: string;
  groupId: string;
}) {
  return client.advanceSettings.selectionMatches(input);
}
