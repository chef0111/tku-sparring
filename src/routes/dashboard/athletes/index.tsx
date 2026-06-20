import { createFileRoute } from '@tanstack/react-router';
import { AthletesPage } from '@/features/dashboard/components/athlete/athletes-page';
import {
  athleteProfilesDefaultListInput,
  athleteProfilesQueryOptions,
} from '@/queries/athlete-profile';
import { NotFound } from '@/components/not-found';

export const Route = createFileRoute('/dashboard/athletes/')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      athleteProfilesQueryOptions(athleteProfilesDefaultListInput)
    );
  },
  pendingMs: 0,
  pendingMinMs: 0,
  component: AthletesPage,
  notFoundComponent: NotFound,
});
