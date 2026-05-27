import type { QueryClient } from '@tanstack/react-query';
import { athleteProfileKeys, tournamentAthleteKeys } from '@/queries/keys';

export function invalidateAthleteProfileQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: athleteProfileKeys.all });
  void queryClient.invalidateQueries({ queryKey: tournamentAthleteKeys.all });
}
