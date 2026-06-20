import type {
  TournamentListItem,
  TournamentStatus,
} from '@/contracts/tournament/list';

export interface DashboardStats {
  kpis: {
    totalTournaments: number;
    byStatus: Record<TournamentStatus, number>;
    totalAthletes: number;
    totalGroups: number;
    totalMatches: number;
  };
  chartData: {
    statusMix: Array<{
      status: TournamentStatus;
      count: number;
      label: string;
    }>;
    topByAthletes: Array<{
      name: string;
      athletes: number;
      matches: number;
    }>;
  };
  pipeline: Record<TournamentStatus, Array<TournamentListItem>>;
  recentTournaments: Array<TournamentListItem>;
}

const PIPELINE_CAP = 3;
const RECENT_CAP = 5;
const TOP_TOURNAMENTS_CAP = 8;

export { PIPELINE_CAP as pipelineDisplayLimit };

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

function sortByCreatedAtDesc(a: TournamentListItem, b: TournamentListItem) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function computeDashboardStats(
  tournaments: Array<TournamentListItem>
): DashboardStats {
  const byStatus: Record<TournamentStatus, number> = {
    draft: 0,
    active: 0,
    completed: 0,
  };

  let totalAthletes = 0;
  let totalGroups = 0;
  let totalMatches = 0;

  for (const t of tournaments) {
    byStatus[t.status] += 1;
    totalAthletes += t._count.tournamentAthletes;
    totalGroups += t._count.groups;
    totalMatches += t._count.actionableMatches;
  }

  const sorted = [...tournaments].sort(sortByCreatedAtDesc);

  const pipeline: Record<TournamentStatus, Array<TournamentListItem>> = {
    draft: sorted.filter((t) => t.status === 'draft').slice(0, PIPELINE_CAP),
    active: sorted.filter((t) => t.status === 'active').slice(0, PIPELINE_CAP),
    completed: sorted
      .filter((t) => t.status === 'completed')
      .slice(0, PIPELINE_CAP),
  };

  const statusMix = (['draft', 'active', 'completed'] as const).map(
    (status) => ({
      status,
      count: byStatus[status],
      label: STATUS_LABELS[status],
    })
  );

  const topByAthletes = [...tournaments]
    .sort(
      (a, b) =>
        b._count.tournamentAthletes - a._count.tournamentAthletes ||
        b._count.actionableMatches - a._count.actionableMatches
    )
    .slice(0, TOP_TOURNAMENTS_CAP)
    .map((t) => ({
      name: t.name,
      athletes: t._count.tournamentAthletes,
      matches: t._count.actionableMatches,
    }));

  return {
    kpis: {
      totalTournaments: tournaments.length,
      byStatus,
      totalAthletes,
      totalGroups,
      totalMatches,
    },
    chartData: {
      statusMix,
      topByAthletes,
    },
    pipeline,
    recentTournaments: sorted.slice(0, RECENT_CAP),
  };
}
