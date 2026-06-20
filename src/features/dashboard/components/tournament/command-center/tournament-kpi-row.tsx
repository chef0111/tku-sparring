import { Layers, LayoutGrid, Users } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
import type { MatchData } from '@/contracts/tournament/match';
import type { TournamentData } from '@/contracts/tournament/list';
import {
  HubMetricCard,
  HubMetricFooter,
} from '@/features/dashboard/components/home/hub-panel';
import { countActionableMatchesForGroups } from '@/lib/tournament/bracket/bracket-action-queue';

interface TournamentKpiRowProps {
  tournament: TournamentData;
  divisions: Array<DivisionData>;
  matches: Array<MatchData>;
}

function getArenaCount(divisions: Array<DivisionData>) {
  if (divisions.length === 0) return 0;
  return new Set(divisions.map((d) => d.arenaIndex)).size;
}

function getAssignedAthleteCount(divisions: Array<DivisionData>) {
  return divisions.reduce(
    (sum, division) => sum + division._count.tournamentAthletes,
    0
  );
}

function getDivisionsFooter(arenaCount: number) {
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
  divisions: Array<DivisionData>
) {
  const total = tournament._count.tournamentAthletes;
  const divisionCount = tournament._count.divisions;

  if (total === 0) {
    return <HubMetricFooter status="degraded" value="None" label="added yet" />;
  }

  if (divisionCount === 0) {
    return (
      <HubMetricFooter
        status="degraded"
        value="Unassigned"
        label="create divisions first"
      />
    );
  }

  const unassigned = total - getAssignedAthleteCount(divisions);

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
      label={`across ${divisionCount} ${divisionCount === 1 ? 'division' : 'divisions'}`}
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
  divisions,
  matches,
}: TournamentKpiRowProps) {
  const arenaCount = getArenaCount(divisions);
  const actionableMatchCount = countActionableMatchesForGroups(
    divisions,
    matches
  );

  const tiles = [
    {
      key: 'divisions',
      label: 'Divisions',
      icon: Layers,
      value: tournament._count.divisions,
      footer: getDivisionsFooter(arenaCount),
    },
    {
      key: 'athletes',
      label: 'Athletes',
      icon: Users,
      value: tournament._count.tournamentAthletes,
      footer: getAthletesFooter(tournament, divisions),
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
