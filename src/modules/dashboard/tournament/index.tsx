import { Link } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';
import { TournamentViewer } from './viewer';
import { TournamentViewerLoading } from './viewer/loading';
import { Button } from '@/components/ui/button';
import { useTournament } from '@/queries/tournaments';
import { useGroups } from '@/queries/groups';

interface TournamentPageProps {
  id: string;
}

export function TournamentPage({ id }: TournamentPageProps) {
  const tournamentQuery = useTournament(id);
  const groupsQuery = useGroups(id);

  if (tournamentQuery.isPending) {
    return <TournamentViewerLoading />;
  }

  if (tournamentQuery.isError || !tournamentQuery.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Trophy className="text-muted-foreground size-12" />
        <h2 className="text-lg font-semibold">Tournament not found</h2>
        <Button variant="outline" asChild>
          <Link to="/dashboard/tournament">
            <ArrowLeft />
            Back to tournaments
          </Link>
        </Button>
      </div>
    );
  }

  const tournament = tournamentQuery.data;
  const groups = groupsQuery.data ?? [];

  return (
    <TournamentViewer
      tournament={tournament}
      groups={groups}
      tournamentId={id}
    />
  );
}
