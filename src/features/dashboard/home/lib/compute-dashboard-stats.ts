import type {
  TournamentListItem,
  TournamentStatus,
} from '@/features/dashboard/types';

export type AttentionKind = 'no_athletes' | 'no_groups' | 'no_brackets';

export interface AttentionItem {
  tournamentId: string;
  tournamentName: string;
  kind: AttentionKind;
  message: string;
}

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
  attentionItems: Array<AttentionItem>;
  pipeline: Record<TournamentStatus, Array<TournamentListItem>>;
  recentTournaments: Array<TournamentListItem>;
}

const PIPELINE_CAP = 5;
const RECENT_CAP = 10;
const TOP_TOURNAMENTS_CAP = 8;

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

function sortByCreatedAtDesc(a: TournamentListItem, b: TournamentListItem) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function deriveAttentionItems(
  tournaments: Array<TournamentListItem>
): Array<AttentionItem> {
  const items: Array<AttentionItem> = [];

  for (const t of tournaments) {
    if (t.status !== 'draft') continue;

    const { groups, matches, tournamentAthletes } = t._count;

    if (tournamentAthletes === 0) {
      items.push({
        tournamentId: t.id,
        tournamentName: t.name,
        kind: 'no_athletes',
        message: 'No athletes added yet',
      });
    } else if (groups === 0) {
      items.push({
        tournamentId: t.id,
        tournamentName: t.name,
        kind: 'no_groups',
        message: 'Setup incomplete — no groups',
      });
    } else if (matches === 0) {
      items.push({
        tournamentId: t.id,
        tournamentName: t.name,
        kind: 'no_brackets',
        message: 'Brackets not generated',
      });
    }
  }

  return items;
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
    totalMatches += t._count.matches;
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
        b._count.matches - a._count.matches
    )
    .slice(0, TOP_TOURNAMENTS_CAP)
    .map((t) => ({
      name: t.name,
      athletes: t._count.tournamentAthletes,
      matches: t._count.matches,
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
    attentionItems: deriveAttentionItems(tournaments),
    pipeline,
    recentTournaments: sorted.slice(0, RECENT_CAP),
  };
}
