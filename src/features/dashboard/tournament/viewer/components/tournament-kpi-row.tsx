import { Layers, LayoutGrid, Users } from 'lucide-react';
import type {
  GroupData,
  MatchData,
  TournamentData,
} from '@/features/dashboard/types';
import {
  HubMetricCard,
  HubMetricFooter,
} from '@/features/dashboard/home/components/hub-panel';
import { countActionableMatchesForGroups } from '@/lib/tournament/bracket-action-queue';

interface TournamentKpiRowProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
  matches: Array<MatchData>;
}

function getArenaCount(groups: Array<GroupData>) {
  if (groups.length === 0) return 0;
  return new Set(groups.map((g) => g.arenaIndex)).size;
}

function getAssignedAthleteCount(groups: Array<GroupData>) {
  return groups.reduce(
    (sum, group) => sum + group._count.tournamentAthletes,
    0
  );
}

function getGroupsFooter(arenaCount: number) {
  if (arenaCount === 0) {
    return (
      <HubMetricFooter
        status="degraded"
        value="None"
        label="arenas assigned yet"
      />
    );
  }

  return (
    <HubMetricFooter
      status="maintenance"
      value={String(arenaCount)}
      label={arenaCount === 1 ? 'arena in use' : 'arenas in use'}
    />
  );
}

function getAthletesFooter(
  tournament: TournamentData,
  groups: Array<GroupData>
) {
  const total = tournament._count.tournamentAthletes;
  const groupCount = tournament._count.groups;

  if (total === 0) {
    return <HubMetricFooter status="degraded" value="None" label="added yet" />;
  }

  if (groupCount === 0) {
    return (
      <HubMetricFooter
        status="degraded"
        value="Unassigned"
        label="create groups first"
      />
    );
  }

  const unassigned = total - getAssignedAthleteCount(groups);

  if (unassigned > 0) {
    return (
      <HubMetricFooter
        status="degraded"
        value={String(unassigned)}
        label={
          unassigned === 1
            ? 'athlete awaiting assignment'
            : 'athletes awaiting assignment'
        }
      />
    );
  }

  return (
    <HubMetricFooter
      status="online"
      value="All placed"
      label={`across ${groupCount} ${groupCount === 1 ? 'group' : 'groups'}`}
    />
  );
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
  matches,
}: TournamentKpiRowProps) {
  const arenaCount = getArenaCount(groups);
  const actionableMatchCount = countActionableMatchesForGroups(groups, matches);

  const tiles = [
    {
      key: 'groups',
      label: 'Groups',
      icon: Layers,
      value: tournament._count.groups,
      footer: getGroupsFooter(arenaCount),
    },
    {
      key: 'athletes',
      label: 'Athletes',
      icon: Users,
      value: tournament._count.tournamentAthletes,
      footer: getAthletesFooter(tournament, groups),
    },
    {
      key: 'matches',
      label: 'Matches',
      icon: LayoutGrid,
      value: actionableMatchCount,
      footer: getMatchesFooter(tournament),
    },
  ] as const;

  return (
    <section className="flex flex-col gap-3">
      <div className="grid items-stretch gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-3">
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
