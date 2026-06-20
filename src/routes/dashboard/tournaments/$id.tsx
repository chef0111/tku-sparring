import { createFileRoute } from '@tanstack/react-router';
import { TournamentCommandCenter } from '@/features/dashboard/components/tournament/command-center';
import { useTournamentRealtimeStream } from '@/hooks/use-tournament-realtime-stream';
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
  component: TournamentPage,
});

function TournamentPage() {
  const { id } = Route.useParams();
  useTournamentRealtimeStream(id);

  return <TournamentCommandCenter tournamentId={id} />;
}
