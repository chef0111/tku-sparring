import { createFileRoute } from '@tanstack/react-router';
import { TournamentBuilderPage } from '@/features/dashboard/tournament/builder';
import LoadingScreen from '@/components/navigation/loading';
import { groupListQueryOptions } from '@/queries/group/group-list-query-options';
import { tournamentQueryOptions } from '@/queries/tournaments';

export const Route = createFileRoute('/dashboard_/tournaments/$id/builder')({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentQueryOptions(params.id));
    await queryClient.ensureQueryData(groupListQueryOptions(params.id));
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
