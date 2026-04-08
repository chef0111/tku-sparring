import { createFileRoute } from '@tanstack/react-router';
import { DashboardHome } from '@/modules/dashboard';
import { NotFound } from '@/components/not-found';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
  notFoundComponent: NotFound,
});
