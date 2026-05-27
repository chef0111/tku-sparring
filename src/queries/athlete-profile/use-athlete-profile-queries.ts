import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import type { AthleteProfilesDTO } from '@/orpc/athlete-profiles/dto';
import { athleteProfilesQueryOptions } from '@/queries/athlete-profile/athlete-profile-query-options';
import { athleteProfileKeys } from '@/queries/keys';
import { listAthleteProfiles } from '@/queries/api/athlete-profile-api';

export function useAthleteProfiles(input: AthleteProfilesDTO) {
  return useQuery({
    ...athleteProfilesQueryOptions(input),
    placeholderData: keepPreviousData,
  });
}

export function useAthleteProfilesInfinite(
  input: Omit<AthleteProfilesDTO, 'page'>
) {
  return useInfiniteQuery({
    queryKey: athleteProfileKeys.listInfinite(input),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      listAthleteProfiles({ ...input, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return fetched < last.total ? allPages.length + 1 : undefined;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAthleteProfilesOrgTotal(options: { enabled?: boolean }) {
  return useQuery({
    ...athleteProfilesQueryOptions({
      page: 1,
      perPage: 1,
      filters: [],
      joinOperator: 'and',
      sorting: [],
    }),
    enabled: options.enabled ?? true,
    select: (data) => data.total,
  });
}
