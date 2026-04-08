import { createFileRoute } from '@tanstack/react-router';
import { AthleteManager } from '@/modules/dashboard/athlete';

export const Route = createFileRoute('/dashboard/athlete/')({
  component: AthletesPage,
});

function AthletesPage() {
  return <AthleteManager />;
}
