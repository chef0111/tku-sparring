import { describe, expect, it } from 'vitest';
import { computeCommandCenter } from '../compute-command-center';
import type {
  GroupData,
  MatchData,
  TournamentData,
} from '@/features/dashboard/types';

const tournament = {
  id: 't1',
  name: 'Test',
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
  lifecycle: { canComplete: false },
  groups: [],
  _count: { groups: 1, matches: 4, tournamentAthletes: 8 },
} satisfies TournamentData;

const groups: Array<GroupData> = [
  {
    id: 'g1',
    name: 'Group A',
    gender: 'M',
    beltMin: 0,
    beltMax: 10,
    weightMin: 20,
    weightMax: 100,
    thirdPlaceMatch: false,
    arenaIndex: 1,
    _count: { tournamentAthletes: 8, matches: 4 },
  },
];

describe('computeCommandCenter', () => {
  it('aggregates match status counts per group', () => {
    const result = computeCommandCenter({
      tournament,
      groups,
      matches: [
        { id: 'm1', groupId: 'g1', status: 'complete', kind: 'bracket' },
        { id: 'm2', groupId: 'g1', status: 'pending', kind: 'bracket' },
        { id: 'm3', groupId: 'g1', status: 'active', kind: 'bracket' },
        { id: 'm4', groupId: 'g1', status: 'complete', kind: 'bracket' },
      ] as Array<MatchData>,
    });

    expect(result.groupProgress[0]).toMatchObject({
      groupId: 'g1',
      pending: 1,
      active: 1,
      complete: 2,
      total: 4,
    });
  });

  it('derives setup steps for draft tournament', () => {
    const result = computeCommandCenter({ tournament, groups, matches: [] });

    expect(result.setupSteps).toEqual([
      expect.objectContaining({ id: 'athletes', complete: true }),
      expect.objectContaining({ id: 'groups', complete: true }),
      expect.objectContaining({ id: 'brackets', complete: false }),
    ]);
  });

  it('computes match totals', () => {
    const result = computeCommandCenter({
      tournament,
      groups,
      matches: [
        { id: 'm1', groupId: 'g1', status: 'complete', kind: 'bracket' },
        { id: 'm2', groupId: 'g1', status: 'pending', kind: 'bracket' },
      ] as Array<MatchData>,
    });

    expect(result.matchTotals).toEqual({
      complete: 1,
      active: 0,
      pending: 1,
      total: 2,
    });
  });

  it('treats custom-only matches as brackets not generated', () => {
    const result = computeCommandCenter({
      tournament,
      groups,
      matches: [
        { id: 'c1', groupId: 'g1', status: 'pending', kind: 'custom' },
      ] as Array<MatchData>,
    });

    expect(result.setupSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'brackets', complete: false }),
      ])
    );
    expect(result.matchTotals.total).toBe(1);
  });
});
