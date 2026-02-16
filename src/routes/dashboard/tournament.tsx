import { createFileRoute } from '@tanstack/react-router';
import { TournamentListPage } from '@/modules/dashboard';

export const Route = createFileRoute('/dashboard/tournament')({
  component: TournamentListPage,
});
