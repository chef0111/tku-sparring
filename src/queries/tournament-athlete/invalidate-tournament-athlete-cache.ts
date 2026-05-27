import type { QueryClient } from '@tanstack/react-query';
import { tournamentAthleteKeys, tournamentKeys } from '@/queries/keys';

export function invalidateTournamentAthleteQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: tournamentAthleteKeys.all });
  void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
}
