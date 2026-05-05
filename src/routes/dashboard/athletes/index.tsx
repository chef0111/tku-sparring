import { createFileRoute } from '@tanstack/react-router';
import { AthleteManager } from '@/features/dashboard/athlete';
import { NotFound } from '@/components/not-found';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { athleteProfilesQueryOptions } from '@/queries/athlete-profiles';

export const Route = createFileRoute('/dashboard/athletes/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      athleteProfilesQueryOptions({ page: 1, perPage: 20, sortDir: 'asc' })
    );
  },

  pendingComponent: () => (
    <div className="p-4">
      <DataTableSkeleton columnCount={7} rowCount={10} />
    </div>
  ),
  pendingMs: 100,
  pendingMinMs: 200,

  component: AthleteManager,
  notFoundComponent: NotFound,
});
