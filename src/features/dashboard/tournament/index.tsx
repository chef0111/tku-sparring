import { TournamentCommandCenter } from './command-center';
import { useTournamentRealtimeStream } from '@/hooks/use-tournament-realtime-stream';

interface TournamentPageProps {
  id: string;
}

export function TournamentPage({ id }: TournamentPageProps) {
  useTournamentRealtimeStream(id);
  return <TournamentCommandCenter tournamentId={id} />;
}
