import { queryOptions } from '@tanstack/react-query';
import { divisionKeys } from '@/queries/keys';
import { listDivisions } from '@/queries/api/division-api';

export function divisionListQueryOptions(tournamentId: string) {
  return queryOptions({
    queryKey: divisionKeys.list(tournamentId),
    queryFn: () => listDivisions(tournamentId),
  });
}
