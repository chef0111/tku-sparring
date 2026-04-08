import { createFileRoute } from '@tanstack/react-router';
import { TournamentListPage } from '@/modules/dashboard';
import { NotFound } from '@/components/not-found';

export const Route = createFileRoute('/dashboard/tournaments/')({
  component: TournamentListPage,
  notFoundComponent: NotFound,
});
