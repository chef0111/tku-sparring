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
    _count: { groups: 0, matches: 0, tournamentAthletes: 0 },
    ...overrides,
  };
}

describe('computeDashboardStats', () => {
  it('aggregates KPI counts across tournaments', () => {
    const items = [
      makeTournament({
        id: '1',
        status: 'draft',
        _count: { groups: 2, matches: 10, tournamentAthletes: 20 },
      }),
      makeTournament({
        id: '2',
        status: 'active',
        _count: { groups: 1, matches: 5, tournamentAthletes: 8 },
      }),
    ];

    const result = computeDashboardStats(items);

    expect(result.kpis.totalTournaments).toBe(2);
    expect(result.kpis.byStatus).toEqual({ draft: 1, active: 1, completed: 0 });
    expect(result.kpis.totalAthletes).toBe(28);
    expect(result.kpis.totalGroups).toBe(3);
    expect(result.kpis.totalMatches).toBe(15);
  });

  it('derives needs-attention items for incomplete draft tournaments', () => {
    const items = [
      makeTournament({ id: 'a', status: 'draft', name: 'Empty' }),
      makeTournament({
        id: 'b',
        status: 'draft',
        name: 'No brackets',
        _count: { groups: 2, matches: 0, tournamentAthletes: 5 },
      }),
    ];

    const result = computeDashboardStats(items);

    expect(result.attentionItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tournamentId: 'a', kind: 'no_athletes' }),
        expect.objectContaining({ tournamentId: 'b', kind: 'no_brackets' }),
      ])
    );
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
