import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListTournamentsDTO } from '@/orpc/tournaments/dto';
import {
  tournamentQueryOptions,
  tournamentsAllQueryOptions,
  tournamentsListQueryOptions,
} from '@/queries/tournament/tournament-query-options';

export function useTournaments() {
  return useQuery({
    ...tournamentsAllQueryOptions(),
    select: (data) => data.items,
  });
}

export function useTournamentList(input: ListTournamentsDTO) {
  return useQuery({
    ...tournamentsListQueryOptions(input),
    placeholderData: keepPreviousData,
  });
}

export function useTournament(id: string) {
  return useQuery(tournamentQueryOptions(id));
}
