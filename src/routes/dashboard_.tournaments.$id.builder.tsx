import { createFileRoute } from '@tanstack/react-router';
import { TournamentBuilder } from '@/features/dashboard/components/tournament/builder';
import LoadingScreen from '@/components/navigation/loading';
import { divisionListQueryOptions } from '@/queries/division/division-list-query-options';
import { tournamentQueryOptions } from '@/queries/tournament';
import { ThemeProvider } from '@/contexts/themes';

export const Route = createFileRoute('/dashboard_/tournaments/$id/builder')({
  loader: ({ params, context: { queryClient } }) => {
    void queryClient.prefetchQuery(tournamentQueryOptions(params.id));
    void queryClient.prefetchQuery(divisionListQueryOptions(params.id));
  },
  pendingComponent: () => <LoadingScreen title="Loading workspace..." />,
  component: TournamentBuilderPage,
});

function TournamentBuilderPage() {
  const { id } = Route.useParams();

  return (
    <ThemeProvider defaultTheme="system" storageKey="start-theme">
      <TournamentBuilder id={id} />
    </ThemeProvider>
  );
}
