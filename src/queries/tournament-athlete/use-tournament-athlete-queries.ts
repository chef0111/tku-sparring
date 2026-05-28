import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/dto';
import { tournamentAthleteKeys } from '@/queries/keys';
import {
  getAthleteIdentityKey,
  listTournamentAthletes,
} from '@/queries/api/tournament-athlete-api';
import { tournamentAthletesQueryOptions } from '@/queries/tournament-athlete/tournament-athlete-query-options';

export function useTournamentAthletes(input: ListTournamentAthletesDTO) {
  const placeholderIdentity = getAthleteIdentityKey(input);
  return useQuery({
    ...tournamentAthletesQueryOptions(input),
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) return undefined;
      const prevInput = previousQuery.queryKey[2] as ListTournamentAthletesDTO;
      if (getAthleteIdentityKey(prevInput) !== placeholderIdentity) {
        return undefined;
      }
      return previousData;
    },
  });
}

export function useTournamentAthletesInfinite(
  input: Omit<ListTournamentAthletesDTO, 'page'>
) {
  return useInfiniteQuery({
    queryKey: tournamentAthleteKeys.listInfinite(input),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      listTournamentAthletes({ ...input, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return fetched < last.total ? allPages.length + 1 : undefined;
    },
    placeholderData: keepPreviousData,
  });
}
