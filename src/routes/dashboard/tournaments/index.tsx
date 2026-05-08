import { createFileRoute } from '@tanstack/react-router';
import { TournamentListPage } from '@/features/dashboard';
import { NotFound } from '@/components/not-found';
import { tournamentsListQueryOptions } from '@/queries/tournaments';

export const Route = createFileRoute('/dashboard/tournaments/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentsListQueryOptions());
  },
  component: TournamentListPage,
  notFoundComponent: NotFound,
});
