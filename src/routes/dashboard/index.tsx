import { createFileRoute } from '@tanstack/react-router';
import { DashboardHome } from '@/features/dashboard';
import { NotFound } from '@/components/not-found';
import { tournamentsAllQueryOptions } from '@/queries/tournaments';

export const Route = createFileRoute('/dashboard/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(tournamentsAllQueryOptions());
  },
  component: DashboardHome,
  notFoundComponent: NotFound,
});
