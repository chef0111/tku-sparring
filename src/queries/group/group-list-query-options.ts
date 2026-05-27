import { queryOptions } from '@tanstack/react-query';
import { groupKeys } from '@/queries/keys';
import { listGroups } from '@/queries/lib/group/list-groups';

export function groupListQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: groupKeys.list(tournamentId),
    queryFn: () => listGroups(tournamentId),
  });
}
