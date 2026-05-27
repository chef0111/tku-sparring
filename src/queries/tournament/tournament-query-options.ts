import { queryOptions } from '@tanstack/react-query';
import type { ListTournamentsDTO } from '@/orpc/tournaments/dto';
import { tournamentKeys } from '@/queries/keys';
import {
  getTournament,
  listTournaments,
} from '@/queries/lib/tournament/tournament-api';

const ALL_TOURNAMENTS_PER_PAGE = 1000;

export const tournamentsDefaultListInput = {
  page: 1,
  perPage: 20,
  status: [],
  sortDir: 'desc',
} satisfies ListTournamentsDTO;

const tournamentsAllListInput = {
  ...tournamentsDefaultListInput,
  perPage: ALL_TOURNAMENTS_PER_PAGE,
} satisfies ListTournamentsDTO;

export function tournamentsListQueryOptions(input: ListTournamentsDTO) {
  return queryOptions({
    queryKey: tournamentKeys.list(input),
    queryFn: () => listTournaments(input),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function tournamentsAllQueryOptions() {
  return queryOptions({
    queryKey: tournamentKeys.listAll(),
    queryFn: () => listTournaments(tournamentsAllListInput),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function tournamentQueryOptions(id: string) {
  return queryOptions({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => getTournament(id),
  });
}
