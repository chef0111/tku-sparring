import { useQuery } from '@tanstack/react-query';
import {
  matchesByDivisionQueryOptions,
  tournamentMatchesQueryOptions,
} from '@/queries/match/match-query-options';

export function useMatches(divisionId: string | null) {
  return useQuery({
    ...matchesByDivisionQueryOptions(divisionId ?? ''),
    enabled: !!divisionId,
  });
}

export function useTournamentMatches(tournamentId: string) {
  return useQuery(tournamentMatchesQueryOptions(tournamentId));
}
