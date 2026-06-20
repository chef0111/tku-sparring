import type { QueryClient } from '@tanstack/react-query';
import {
  activityKeys,
  divisionKeys,
  matchKeys,
  tournamentKeys,
} from '@/queries/keys';

export function invalidateTournamentQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
}

export function invalidateTournamentDetail(
  queryClient: QueryClient,
  tournamentId: string
) {
  void queryClient.invalidateQueries({
    queryKey: tournamentKeys.detail(tournamentId),
  });
}

export function invalidateAfterArenaLayoutChange(
  queryClient: QueryClient,
  tournamentId: string
) {
  invalidateTournamentDetail(queryClient, tournamentId);
  void queryClient.invalidateQueries({
    queryKey: divisionKeys.list(tournamentId),
  });
  void queryClient.invalidateQueries({
    queryKey: matchKeys.listByTournament(tournamentId),
  });
}

export function invalidateAfterTournamentStatusChange(
  queryClient: QueryClient,
  tournamentId: string
) {
  invalidateTournamentQueries(queryClient);
  void queryClient.invalidateQueries({
    queryKey: activityKeys.list(tournamentId, 'all'),
  });
  void queryClient.invalidateQueries({
    queryKey: matchKeys.listByTournament(tournamentId),
  });
}
