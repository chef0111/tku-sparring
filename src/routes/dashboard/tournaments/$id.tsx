import { createFileRoute } from '@tanstack/react-router';
import { TournamentPage } from '@/features/dashboard';

export const Route = createFileRoute('/dashboard/tournaments/$id')({
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  return <TournamentPage id={id} />;
}
