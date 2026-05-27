import { queryOptions } from '@tanstack/react-query';
import { groupKeys } from '@/queries/keys';
import { listGroups } from '@/queries/api/group-api';

export function groupListQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: groupKeys.list(tournamentId),
    queryFn: () => listGroups(tournamentId),
  });
}
