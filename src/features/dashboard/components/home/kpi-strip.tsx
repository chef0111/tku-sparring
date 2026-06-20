import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Layers, LayoutGrid, Trophy, Users } from 'lucide-react';
import { HubMetricCard, HubMetricFooter } from './hub-panel';
import type { DashboardStats } from '@/features/dashboard/lib/home/compute-dashboard-stats';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';

interface KpiStripProps {
  stats: DashboardStats['kpis'];
}

function formatAvgPerTournament(total: number, tournaments: number) {
  if (tournaments === 0) return '0';
  const avg = total / tournaments;
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

function StatusMixFooter({ stats }: { stats: DashboardStats['kpis'] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Status status="degraded">
        <StatusIndicator />
        <StatusLabel>{stats.byStatus.draft} draft</StatusLabel>
      </Status>
      <Status status="online">
        <StatusIndicator />
        <StatusLabel>{stats.byStatus.active} active</StatusLabel>
      </Status>
      <Status status="maintenance">
        <StatusIndicator />
        <StatusLabel>{stats.byStatus.completed} done</StatusLabel>
      </Status>
    </div>
  );
}

export function KpiStrip({ stats }: KpiStripProps) {
  const avgAthletes = formatAvgPerTournament(
    stats.totalAthletes,
    stats.totalTournaments
  );
  const avgGroups = formatAvgPerTournament(
    stats.totalGroups,
    stats.totalTournaments
  );
  const avgMatches = formatAvgPerTournament(
    stats.totalMatches,
    stats.totalTournaments
  );

  const tiles = [
    {
      key: 'tournaments',
      label: 'Tournaments',
      icon: Trophy,
      value: stats.totalTournaments,
      footer: <StatusMixFooter stats={stats} />,
      action: (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground size-7"
          asChild
        >
          <Link to="/dashboard/tournaments" aria-label="View all tournaments">
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
    {
      key: 'athletes',
      label: 'Athletes',
      icon: Users,
      value: stats.totalAthletes,
      footer: (
        <HubMetricFooter
          status="online"
          value={`${avgAthletes} avg`}
          label="registers per tournament"
        />
      ),
    },
    {
      key: 'groups',
      label: 'Groups',
      icon: Layers,
      value: stats.totalGroups,
      footer: (
        <HubMetricFooter
          status="maintenance"
          value={`${avgGroups} avg`}
          label="division buckets in play"
        />
      ),
    },
    {
      key: 'matches',
      label: 'Matches',
      icon: LayoutGrid,
      value: stats.totalMatches,
      footer: (
        <HubMetricFooter
          status="degraded"
          value={`${avgMatches} avg`}
          label="across all tournaments"
        />
      ),
    },
  ] as const;

  return (
    <section className="flex flex-col gap-3">
      <div className="grid items-stretch gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <HubMetricCard
            key={tile.key}
            label={tile.label}
            icon={tile.icon}
            value={tile.value}
            footer={tile.footer}
            action={'action' in tile ? tile.action : undefined}
          />
        ))}
      </div>
    </section>
  );
}
