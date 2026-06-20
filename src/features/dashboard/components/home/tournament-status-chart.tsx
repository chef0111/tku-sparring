'use client';

import { PieChart } from 'lucide-react';
import type { ChartConfig } from '@/components/evilcharts/ui/chart';
import type { DashboardStats } from '@/features/dashboard/lib/home/compute-dashboard-stats';
import {
  EvilPieChart,
  Legend,
  Pie,
  Tooltip,
} from '@/components/evilcharts/charts/pie-chart';
import { HubChartPanel } from '@/features/dashboard/components/home/hub-panel';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

const statusChartConfig = {
  draft: {
    label: 'Draft',
    colors: {
      light: ['var(--chart-4)'],
      dark: ['var(--chart-4)'],
    },
  },
  active: {
    label: 'Active',
    colors: {
      light: ['var(--chart-2)'],
      dark: ['var(--chart-2)'],
    },
  },
  completed: {
    label: 'Completed',
    colors: {
      light: ['var(--chart-3)'],
      dark: ['var(--chart-3)'],
    },
  },
} satisfies ChartConfig;

interface TournamentStatusChartProps {
  statusMix: DashboardStats['chartData']['statusMix'];
}

export function TournamentStatusChart({
  statusMix,
}: TournamentStatusChartProps) {
  const total = statusMix.reduce((sum, item) => sum + item.count, 0);
  const hasData = total > 0;

  return (
    <HubChartPanel
      label="Tournament mix"
      icon={PieChart}
      description="Share of tournaments by lifecycle status"
      footer={
        hasData ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {total} tournament{total === 1 ? '' : 's'} total
          </p>
        ) : null
      }
    >
      {hasData ? (
        <EvilPieChart
          config={statusChartConfig}
          data={statusMix}
          dataKey="count"
          nameKey="status"
          className="min-h-55 w-full"
        >
          <Pie innerRadius="55%" cornerRadius={4} paddingAngle={2} />
          <Tooltip variant="default" />
          <Legend variant="circle" />
        </EvilPieChart>
      ) : (
        <Empty className="min-h-50 border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PieChart aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No tournaments yet</EmptyTitle>
            <EmptyDescription>
              Status breakdown appears once tournaments are created.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </HubChartPanel>
  );
}
