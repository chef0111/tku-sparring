'use client';

import { BarChart3 } from 'lucide-react';
import type { ChartConfig } from '@/components/evilcharts/ui/chart';
import type { DashboardStats } from '@/features/dashboard/home/lib/compute-dashboard-stats';
import {
  Bar,
  EvilBarChart,
  Grid,
  Tooltip,
  XAxis,
  YAxis,
} from '@/components/evilcharts/charts/bar-chart';
import { HubChartPanel } from '@/features/dashboard/home/components/hub-panel';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

const athletesChartConfig = {
  athletes: {
    label: 'Athletes',
    colors: {
      light: ['var(--chart-1)'],
      dark: ['var(--chart-1)'],
    },
  },
} satisfies ChartConfig;

interface TopTournamentsChartProps {
  topByAthletes: DashboardStats['chartData']['topByAthletes'];
}

export function TopTournamentsChart({
  topByAthletes,
}: TopTournamentsChartProps) {
  const hasData = topByAthletes.length > 0;

  return (
    <HubChartPanel
      label="Largest events"
      icon={BarChart3}
      description="Top tournaments by registered athletes"
      footer={
        hasData ? (
          <p className="text-muted-foreground text-xs">
            Sorted by athlete count across all tournaments
          </p>
        ) : null
      }
    >
      {hasData ? (
        <EvilBarChart
          config={athletesChartConfig}
          data={topByAthletes}
          xDataKey="name"
          layout="horizontal"
          className="min-h-[220px] w-full"
          chartProps={{ margin: { left: 8, right: 8, top: 8, bottom: 0 } }}
        >
          <Grid horizontal={false} vertical />
          <XAxis tickLine={false} axisLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            width={96}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              typeof value === 'string' && value.length > 14
                ? `${value.slice(0, 14)}…`
                : String(value)
            }
          />
          <Bar dataKey="athletes" radius={4} />
          <Tooltip variant="line" />
        </EvilBarChart>
      ) : (
        <Empty className="min-h-[200px] border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BarChart3 aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No athlete data</EmptyTitle>
            <EmptyDescription>
              Comparison chart fills in as tournaments register athletes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </HubChartPanel>
  );
}
