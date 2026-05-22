import { describe, expect, it } from 'vitest';
import { computeDashboardStats } from '../compute-dashboard-stats';
import type { TournamentListItem } from '@/features/dashboard/types';

function makeTournament(
  overrides: Partial<TournamentListItem> &
    Pick<TournamentListItem, 'id' | 'status'>
): TournamentListItem {
  return {
    name: 'Test',
    createdAt: new Date('2026-01-01'),
    _count: {
      groups: 0,
      matches: 0,
      tournamentAthletes: 0,
      actionableMatches: 0,
    },
    ...overrides,
  };
}

describe('computeDashboardStats', () => {
  it('aggregates KPI counts across tournaments', () => {
    const items = [
      makeTournament({
        id: '1',
        status: 'draft',
        _count: {
          groups: 2,
          matches: 10,
          tournamentAthletes: 20,
          actionableMatches: 6,
        },
      }),
      makeTournament({
        id: '2',
        status: 'active',
        _count: {
          groups: 1,
          matches: 5,
          tournamentAthletes: 8,
          actionableMatches: 4,
        },
      }),
    ];

    const result = computeDashboardStats(items);

    expect(result.kpis.totalTournaments).toBe(2);
    expect(result.kpis.byStatus).toEqual({ draft: 1, active: 1, completed: 0 });
    expect(result.kpis.totalAthletes).toBe(28);
    expect(result.kpis.totalGroups).toBe(3);
    expect(result.kpis.totalMatches).toBe(10);
  });

  it('builds chart payloads for status mix and top tournaments', () => {
    const items = [
      makeTournament({
        id: '1',
        name: 'Alpha Open',
        status: 'draft',
        _count: {
          groups: 2,
          matches: 10,
          tournamentAthletes: 20,
          actionableMatches: 6,
        },
      }),
      makeTournament({
        id: '2',
        name: 'Beta Cup',
        status: 'active',
        _count: {
          groups: 1,
          matches: 5,
          tournamentAthletes: 30,
          actionableMatches: 4,
        },
      }),
      makeTournament({
        id: '3',
        name: 'Gamma Classic',
        status: 'completed',
        _count: {
          groups: 1,
          matches: 8,
          tournamentAthletes: 12,
          actionableMatches: 3,
        },
      }),
    ];

    const result = computeDashboardStats(items);

    expect(result.chartData.statusMix).toEqual([
      { status: 'draft', count: 1, label: 'Draft' },
      { status: 'active', count: 1, label: 'Active' },
      { status: 'completed', count: 1, label: 'Completed' },
    ]);
    expect(result.chartData.topByAthletes[0]).toEqual({
      name: 'Beta Cup',
      athletes: 30,
      matches: 4,
    });
  });

  it('groups pipeline by status sorted by createdAt desc', () => {
    const items = [
      makeTournament({
        id: 'old',
        status: 'draft',
        createdAt: new Date('2026-01-01'),
      }),
      makeTournament({
        id: 'new',
        status: 'draft',
        createdAt: new Date('2026-02-01'),
      }),
    ];

    const result = computeDashboardStats(items);

    expect(result.pipeline.draft.map((t) => t.id)).toEqual(['new', 'old']);
  });
});
