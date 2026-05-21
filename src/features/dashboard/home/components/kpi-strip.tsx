import { Layers, LayoutGrid, Trophy, Users } from 'lucide-react';
import type { DashboardStats } from '../lib/compute-dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KpiStripProps {
  stats: DashboardStats['kpis'];
}

const tiles = [
  {
    key: 'tournaments',
    label: 'Tournaments',
    icon: LayoutGrid,
    getValue: (stats: DashboardStats['kpis']) => stats.totalTournaments,
    getSecondary: (stats: DashboardStats['kpis']) =>
      `${stats.byStatus.draft} draft · ${stats.byStatus.active} active · ${stats.byStatus.completed} done`,
  },
  {
    key: 'athletes',
    label: 'Athletes',
    icon: Users,
    getValue: (stats: DashboardStats['kpis']) => stats.totalAthletes,
  },
  {
    key: 'groups',
    label: 'Groups',
    icon: Layers,
    getValue: (stats: DashboardStats['kpis']) => stats.totalGroups,
  },
  {
    key: 'matches',
    label: 'Matches',
    icon: Trophy,
    getValue: (stats: DashboardStats['kpis']) => stats.totalMatches,
  },
] as const;

export function KpiStrip({ stats }: KpiStripProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Overview
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile, index) => {
          const Icon = tile.icon;
          return (
            <Card
              key={tile.key}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {tile.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="text-2xl font-semibold tabular-nums">
                  {tile.getValue(stats)}
                </p>
                {'getSecondary' in tile && tile.getSecondary ? (
                  <p className="text-muted-foreground text-xs">
                    {tile.getSecondary(stats)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
