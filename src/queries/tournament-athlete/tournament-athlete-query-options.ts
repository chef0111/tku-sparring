import { queryOptions } from '@tanstack/react-query';
import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/dto';
import { tournamentAthleteKeys } from '@/queries/keys';
import { listTournamentAthletes } from '@/queries/api/tournament-athlete-api';

export function tournamentAthletesQueryOptions(
  input: ListTournamentAthletesDTO
) {
  return queryOptions({
    queryKey: tournamentAthleteKeys.list(input),
    queryFn: () => listTournamentAthletes(input),
  });
}

export { listAthleteListIdentityKey } from '@/queries/api/tournament-athlete-api';
