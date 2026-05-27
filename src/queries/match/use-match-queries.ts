import { useQuery } from '@tanstack/react-query';
import {
  matchesByGroupQueryOptions,
  tournamentMatchesQueryOptions,
} from '@/queries/match/match-query-options';

export function useMatches(groupId: string | null) {
  return useQuery({
    ...matchesByGroupQueryOptions(groupId ?? ''),
    enabled: !!groupId,
  });
}

export function useTournamentMatches(tournamentId: string) {
  return useQuery(tournamentMatchesQueryOptions(tournamentId));
}
