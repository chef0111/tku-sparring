import { createFileRoute } from '@tanstack/react-router';
import { NotFound } from '@/components/not-found';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import {
  athleteProfilesDefaultListInput,
  athleteProfilesQueryOptions,
} from '@/queries/athlete-profiles';
import { SiteHeader } from '@/features/dashboard/site-header';
import AthletesManager from '@/features/dashboard/athlete';

export const Route = createFileRoute('/dashboard/athletes/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      athleteProfilesQueryOptions(athleteProfilesDefaultListInput)
    );
  },

  pendingComponent: () => (
    <div className="flex h-full flex-col">
      <SiteHeader title="Athletes" />
      <div className="p-4">
        <DataTableSkeleton columnCount={7} rowCount={10} />
      </div>
    </div>
  ),
  pendingMs: 0,
  pendingMinMs: 0,

  component: AthletesManager,
  notFoundComponent: NotFound,
});
