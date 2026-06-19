import { createFileRoute } from '@tanstack/react-router';
import { TournamentPage } from '@/features/dashboard';
import { groupListQueryOptions } from '@/queries/group/group-list-query-options';
import { activityListInfiniteQueryOptions } from '@/queries/activity';
import { tournamentMatchesQueryOptions } from '@/queries/match';
import { tournamentQueryOptions } from '@/queries/tournament';

export const Route = createFileRoute('/dashboard/tournaments/$id')({
  loader: ({ params, context: { queryClient } }) => {
    void queryClient.prefetchQuery(tournamentQueryOptions(params.id));
    void queryClient.prefetchQuery(groupListQueryOptions(params.id));
    void queryClient.prefetchQuery(tournamentMatchesQueryOptions(params.id));
    void queryClient.prefetchInfiniteQuery({
      ...activityListInfiniteQueryOptions({
        tournamentId: params.id,
        limit: 8,
      }),
    });
  },
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  return <TournamentPage id={id} />;
}
