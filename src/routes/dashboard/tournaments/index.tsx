import { createFileRoute } from '@tanstack/react-router';
import { TournamentsPage } from '@/features/dashboard';
import { NotFound } from '@/components/not-found';
import { tournamentsAllQueryOptions } from '@/queries/tournament';

export const Route = createFileRoute('/dashboard/tournaments/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentsAllQueryOptions());
  },
  component: TournamentsPage,
  notFoundComponent: NotFound,
});
