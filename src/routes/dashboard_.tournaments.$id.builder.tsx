import { createFileRoute } from '@tanstack/react-router';
import { TournamentBuilderPage } from '@/features/dashboard/tournament/builder';
import LoadingScreen from '@/components/navigation/loading';
import { tournamentQueryOptions } from '@/queries/tournaments';
import { orpc } from '@/orpc/client';

export const Route = createFileRoute('/dashboard_/tournaments/$id/builder')({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentQueryOptions(params.id));
    await queryClient.ensureQueryData(
      orpc.group.list.queryOptions({ input: { tournamentId: params.id } })
    );
  },
  pendingComponent: () => <LoadingScreen title="Loading workspace..." />,
  pendingMs: 0,
  pendingMinMs: 0,
  component: TournamentBuilder,
});

function TournamentBuilder() {
  const { id } = Route.useParams();
  return <TournamentBuilderPage id={id} />;
}
