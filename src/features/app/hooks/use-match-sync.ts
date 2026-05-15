import { useTournamentRealtimeStream } from '@/hooks/use-tournament-realtime-stream';

export function useMatchSync(args: {
  tournamentId: string | null;
  realtimeEnabled?: boolean;
}) {
  const { tournamentId, realtimeEnabled = true } = args;
  useTournamentRealtimeStream(tournamentId, realtimeEnabled);
}
