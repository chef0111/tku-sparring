import { createFileRoute } from '@tanstack/react-router';
import { TournamentPage } from '@/modules/dashboard';

export const Route = createFileRoute('/dashboard/tournament/$id')({
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  return <TournamentPage id={id} />;
}
