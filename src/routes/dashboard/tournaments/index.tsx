import { createFileRoute } from '@tanstack/react-router';
import { TournamentListPage } from '@/features/dashboard';
import { NotFound } from '@/components/not-found';
import { tournamentsAllQueryOptions } from '@/queries/tournament';

export const Route = createFileRoute('/dashboard/tournaments/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentsAllQueryOptions());
  },
  component: TournamentListPage,
  notFoundComponent: NotFound,
});
