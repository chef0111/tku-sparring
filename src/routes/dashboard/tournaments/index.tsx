import { createFileRoute } from '@tanstack/react-router';
import { NotFound } from '@/components/not-found';
import { tournamentsAllQueryOptions } from '@/queries/tournament';
import { TournamentsOverview } from '@/features/dashboard/tournament/components/overview';

export const Route = createFileRoute('/dashboard/tournaments/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentsAllQueryOptions());
  },
  component: TournamentsOverview,
  notFoundComponent: NotFound,
});
