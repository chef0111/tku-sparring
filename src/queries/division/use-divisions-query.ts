import { useQuery } from '@tanstack/react-query';
import { divisionListQueryOptions } from '@/queries/division/division-list-query-options';

export function useDivisions(tournamentId: string) {
  return useQuery(divisionListQueryOptions(tournamentId));
}
