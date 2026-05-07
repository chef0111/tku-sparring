import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotFound } from '@/components/not-found';
import { Skeleton } from '@/components/ui/skeleton';
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
      <SiteHeader title="Athletes">
        <div className="ml-auto pr-4">
          <Button size="sm">
            <Plus className="mr-1 size-4" />
            Add Athlete
          </Button>
        </div>
      </SiteHeader>
      <div className="p-4">
        <Skeleton className="mb-2 h-7 w-64" />
        <DataTableSkeleton columnCount={7} rowCount={10} />
      </div>
    </div>
  ),
  pendingMs: 0,
  pendingMinMs: 0,

  component: AthletesManager,
  notFoundComponent: NotFound,
});
