import { useTournament } from '@/queries/tournaments';

export function useTournamentReadOnly(tournamentId: string) {
  const tournamentQuery = useTournament(tournamentId);

  return tournamentQuery.data?.status === 'completed';
}
