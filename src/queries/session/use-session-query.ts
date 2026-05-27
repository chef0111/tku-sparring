import { queryOptions } from '@tanstack/react-query';
import { getSession } from '@/lib/session';
import { sessionKeys } from '@/queries/keys';

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKeys.current(),
    queryFn: () => getSession(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
