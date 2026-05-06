import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { AthleteManager } from '@/features/dashboard/athlete';
import { NotFound } from '@/components/not-found';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import {
  athleteProfilesDefaultListInput,
  athleteProfilesQueryOptions,
} from '@/queries/athlete-profiles';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/features/dashboard/site-header';

export const Route = createFileRoute('/dashboard/athletes/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      athleteProfilesQueryOptions(athleteProfilesDefaultListInput)
    );
  },

  pendingComponent: () => (
    <div className="flex h-full flex-col">
      <SiteHeader title="Athletes">
        <div className="ml-auto pr-4">
          <Button size="sm">
            <Plus className="mr-1 size-4" />
            Add Athlete
          </Button>
        </div>
      </SiteHeader>
      <div className="p-4">
        <DataTableSkeleton columnCount={7} rowCount={10} />
      </div>
    </div>
  ),
  pendingMs: 0,
  pendingMinMs: 0,

  component: AthleteManager,
  notFoundComponent: NotFound,
});
