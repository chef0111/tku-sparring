import { useQuery } from '@tanstack/react-query';
import { groupListQueryOptions } from '@/queries/group/group-list-query-options';

export function useGroups(tournamentId: string) {
  return useQuery(groupListQueryOptions(tournamentId));
}
