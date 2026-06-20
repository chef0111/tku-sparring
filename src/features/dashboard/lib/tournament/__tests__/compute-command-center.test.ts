import { describe, expect, it } from 'vitest';
import { computeCommandCenter } from '../compute-command-center';
import type { MatchData } from '@/contracts/tournament/match';
import type { TournamentData } from '@/contracts/tournament/list';

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

describe('computeCommandCenter', () => {
  it('derives setup steps for draft tournament', () => {
    const result = computeCommandCenter({ tournament, matches: [] });

    expect(result.setupSteps).toEqual([
      expect.objectContaining({ id: 'athletes', complete: true }),
      expect.objectContaining({ id: 'groups', complete: true }),
      expect.objectContaining({ id: 'brackets', complete: false }),
    ]);
  });

  it('marks brackets complete when a bracket match exists', () => {
    const result = computeCommandCenter({
      tournament,
      matches: [
        { id: 'm1', groupId: 'g1', status: 'pending', kind: 'bracket' },
      ] as Array<MatchData>,
    });

    expect(result.setupSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'brackets', complete: true }),
      ])
    );
  });

  it('treats custom-only matches as brackets not generated', () => {
    const result = computeCommandCenter({
      tournament,
      matches: [
        { id: 'c1', groupId: 'g1', status: 'pending', kind: 'custom' },
      ] as Array<MatchData>,
    });

    expect(result.setupSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'brackets', complete: false }),
      ])
    );
  });

  it('returns no setup steps for non-draft tournaments', () => {
    const result = computeCommandCenter({
      tournament: { ...tournament, status: 'active' },
      matches: [],
    });

    expect(result.setupSteps).toEqual([]);
  });
});
