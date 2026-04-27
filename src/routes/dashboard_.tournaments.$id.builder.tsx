import { createFileRoute } from '@tanstack/react-router';
import { TournamentBuilderPage } from '@/features/dashboard/tournament/builder';

export const Route = createFileRoute('/dashboard_/tournaments/$id/builder')({
  component: TournamentBuilder,
});

function TournamentBuilder() {
  const { id } = Route.useParams();
  return <TournamentBuilderPage id={id} />;
}
