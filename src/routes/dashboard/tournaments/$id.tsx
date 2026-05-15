import { createFileRoute } from '@tanstack/react-router';
import { TournamentPage } from '@/features/dashboard';
import { TournamentViewerLoading } from '@/features/dashboard/tournament/viewer/loading';
import { activityListInfiniteQueryOptions } from '@/queries/activity';
import { tournamentQueryOptions } from '@/queries/tournaments';
import { orpc } from '@/orpc/client';

export const Route = createFileRoute('/dashboard/tournaments/$id')({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentQueryOptions(params.id));
    await queryClient.ensureQueryData(
      orpc.group.list.queryOptions({ input: { tournamentId: params.id } })
    );
    await queryClient.prefetchInfiniteQuery({
      ...activityListInfiniteQueryOptions({ tournamentId: params.id }),
    });
  },
  pendingComponent: () => <TournamentViewerLoading />,
  pendingMs: 0,
  pendingMinMs: 0,
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  return <TournamentPage id={id} />;
}
