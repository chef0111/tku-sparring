import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_tournaments')({
  component: TournamentsLayout,
});

function TournamentsLayout() {
  return <Outlet />;
}
