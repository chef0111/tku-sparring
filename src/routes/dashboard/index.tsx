import { createFileRoute } from '@tanstack/react-router';
import { DashboardHome } from '@/features/dashboard/components/home/dashboard-home';
import { tournamentsAllQueryOptions } from '@/queries/tournament';
import { NotFound } from '@/components/not-found';

export const Route = createFileRoute('/dashboard/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentsAllQueryOptions());
  },
  component: DashboardHome,
  notFoundComponent: NotFound,
});
