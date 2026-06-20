import { queryOptions } from '@tanstack/react-query';
import { matchKeys } from '@/queries/keys';
import {
  listMatchesByDivision,
  listMatchesByTournament,
} from '@/queries/api/match-api';

export function matchesByDivisionQueryOptions(divisionId: string) {
  return queryOptions({
    queryKey: matchKeys.listByDivision(divisionId),
    queryFn: () => listMatchesByDivision(divisionId),
  });
}

export function tournamentMatchesQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: matchKeys.listByTournament(tournamentId),
    queryFn: () => listMatchesByTournament(tournamentId),
  });
}
