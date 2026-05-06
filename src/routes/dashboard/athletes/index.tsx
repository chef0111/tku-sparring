import { createFileRoute } from '@tanstack/react-router';
import { AthleteManager } from '@/features/dashboard/athlete';
import { NotFound } from '@/components/not-found';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import {
  athleteProfilesDefaultListInput,
  athleteProfilesQueryOptions,
} from '@/queries/athlete-profiles';

export const Route = createFileRoute('/dashboard/athletes/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      athleteProfilesQueryOptions(athleteProfilesDefaultListInput)
    );
  },

  pendingComponent: () => (
    <div className="p-4">
      <DataTableSkeleton columnCount={7} rowCount={10} />
    </div>
  ),
  pendingMs: 0,
  pendingMinMs: 0,

  component: AthleteManager,
  notFoundComponent: NotFound,
});
