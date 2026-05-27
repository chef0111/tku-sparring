import { useTournament } from '@/queries/tournament';

export function useTournamentReadOnly(tournamentId: string) {
  const tournamentQuery = useTournament(tournamentId);

  return tournamentQuery.data?.status === 'completed';
}
