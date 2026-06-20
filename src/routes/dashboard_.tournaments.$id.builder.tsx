import { createFileRoute } from '@tanstack/react-router';
import { TournamentBuilder } from '@/features/dashboard/tournament/components/builder';
import LoadingScreen from '@/components/navigation/loading';
import { groupListQueryOptions } from '@/queries/group/group-list-query-options';
import { tournamentQueryOptions } from '@/queries/tournament';
import { ThemeProvider } from '@/contexts/themes';

export const Route = createFileRoute('/dashboard_/tournaments/$id/builder')({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentQueryOptions(params.id));
    await queryClient.ensureQueryData(groupListQueryOptions(params.id));
  },
  pendingComponent: () => <LoadingScreen title="Loading workspace..." />,
  pendingMs: 0,
  pendingMinMs: 0,
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
