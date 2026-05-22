import { Layers, LayoutGrid, Users } from 'lucide-react';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import {
  HubMetricCard,
  HubMetricFooter,
} from '@/features/dashboard/home/components/hub-panel';

interface TournamentKpiRowProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
}

function getArenaCount(groups: Array<GroupData>) {
  if (groups.length === 0) return 0;
  return new Set(groups.map((g) => g.arenaIndex)).size;
}

function getMatchesFooter(tournament: TournamentData) {
  if (tournament.status === 'draft') {
    return (
      <HubMetricFooter status="degraded" value="Setup" label="in progress" />
    );
  }

  if (tournament.status === 'completed') {
    return (
      <HubMetricFooter status="maintenance" value="Locked" label="read-only" />
    );
  }

  if (tournament.lifecycle.canComplete) {
    return (
      <HubMetricFooter
        status="online"
        value="Ready"
        label="to complete tournament"
      />
    );
  }

  return (
    <HubMetricFooter status="online" value="In progress" label="live results" />
  );
}

export function TournamentKpiRow({
  tournament,
  groups,
}: TournamentKpiRowProps) {
  const arenaCount = getArenaCount(groups);

  const tiles = [
    {
      key: 'groups',
      label: 'Groups',
      icon: Layers,
      value: tournament._count.groups,
      footer:
        arenaCount > 0 ? (
          <HubMetricFooter
            status="maintenance"
            value={String(arenaCount)}
            label={arenaCount === 1 ? 'arena in use' : 'arenas in use'}
          />
        ) : undefined,
    },
    {
      key: 'athletes',
      label: 'Athletes',
      icon: Users,
      value: tournament._count.tournamentAthletes,
      footer: undefined,
    },
    {
      key: 'matches',
      label: 'Matches',
      icon: LayoutGrid,
      value: tournament._count.matches,
      footer: getMatchesFooter(tournament),
    },
  ] as const;

  return (
    <section className="flex flex-col gap-3">
      <div className="grid gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <HubMetricCard
            key={tile.key}
            label={tile.label}
            icon={tile.icon}
            value={tile.value}
            footer={tile.footer}
          />
        ))}
      </div>
    </section>
  );
}
