import { TopTournamentsChart } from './top-tournaments-chart';
import { TournamentStatusChart } from './tournament-status-chart';
import type { DashboardStats } from '@/features/dashboard/lib/home/compute-dashboard-stats';

interface HubChartsSectionProps {
  chartData: DashboardStats['chartData'];
}

export function HubChartsSection({ chartData }: HubChartsSectionProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <TournamentStatusChart statusMix={chartData.statusMix} />
      <TopTournamentsChart topByAthletes={chartData.topByAthletes} />
    </section>
  );
}
