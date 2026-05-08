import { queryOptions } from '@tanstack/react-query';
import { getSession } from '@/lib/session';

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: ['session'],
    queryFn: () => getSession(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
