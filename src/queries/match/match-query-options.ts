import { queryOptions } from '@tanstack/react-query';
import { matchKeys } from '@/queries/keys';
import {
  listMatchesByGroup,
  listMatchesByTournament,
} from '@/queries/lib/match/list-matches';

export function matchesByGroupQueryOptions(groupId: string) {
  return queryOptions({
    queryKey: matchKeys.listByGroup(groupId),
    queryFn: () => listMatchesByGroup(groupId),
  });
}

export function tournamentMatchesQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: matchKeys.listByTournament(tournamentId),
    queryFn: () => listMatchesByTournament(tournamentId),
  });
}
