import { createFileRoute } from '@tanstack/react-router';
import { AthleteManager } from '@/modules/dashboard/athlete';
import { NotFound } from '@/components/not-found';

export const Route = createFileRoute('/dashboard/athletes/')({
  component: AthleteManager,
  notFoundComponent: NotFound,
});
