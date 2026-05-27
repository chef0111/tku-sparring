import { queryOptions } from '@tanstack/react-query';
import type { AthleteProfilesDTO } from '@/orpc/athlete-profiles/dto';
import { DEFAULT_SORTING } from '@/config/athlete';
import { athleteProfileKeys } from '@/queries/keys';
import { listAthleteProfiles } from '@/queries/lib/athlete-profile/athlete-profile-api';

export const athleteProfilesDefaultListInput = {
  page: 1,
  perPage: 10,
  filters: [],
  joinOperator: 'and',
  sorting: DEFAULT_SORTING,
} satisfies AthleteProfilesDTO;

export function athleteProfilesQueryOptions(input: AthleteProfilesDTO) {
  return queryOptions({
    queryKey: athleteProfileKeys.list(input),
    queryFn: () => listAthleteProfiles(input),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}
