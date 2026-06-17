import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assertLabelAvailable } from '@/lib/tournament/custom/custom-match-label';
import { loadMatchLabelContext } from '@/lib/tournament/arena/match-label-context';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/tournament/arena/match-label-context', () => ({
  normalizeMatchLabelKey: (label: string) => label.trim().toLowerCase(),
  loadMatchLabelContext: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.match.findMany).mockResolvedValue([]);
  vi.mocked(loadMatchLabelContext).mockResolvedValue({
    arenaIndex: 1,
    groupIdsOnArena: ['g1'],
    allMatches: [],
    numbers: new Map(),
    assignedBracketTitleKeys: new Set(),
  });
});

describe('assertLabelAvailable', () => {
  it('rejects empty labels', async () => {
    await expect(
      assertLabelAvailable({
        tournamentId: 't1',
        groupId: 'g1',
        displayLabel: '   ',
      })
    ).rejects.toThrow(/label is required/);
  });

  it('rejects duplicate custom labels', async () => {
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      { id: 'm-existing', displayLabel: 'Final Preview' },
    ] as never);

    await expect(
      assertLabelAvailable({
        tournamentId: 't1',
        groupId: 'g1',
        displayLabel: ' final preview ',
      })
    ).rejects.toThrow(/already used/);
  });

  it('rejects arena Match {n} collisions', async () => {
    vi.mocked(loadMatchLabelContext).mockResolvedValue({
      arenaIndex: 1,
      groupIdsOnArena: ['g1'],
      allMatches: [],
      numbers: new Map(),
      assignedBracketTitleKeys: new Set(['match 101']),
    });

    await expect(
      assertLabelAvailable({
        tournamentId: 't1',
        groupId: 'g1',
        displayLabel: 'Match 101',
      })
    ).rejects.toThrow(/arena match number/);
  });

  it('permits editing the same custom match label when excluded', async () => {
    await expect(
      assertLabelAvailable({
        tournamentId: 't1',
        groupId: 'g1',
        displayLabel: 'Final Preview',
        excludeMatchId: 'm-existing',
      })
    ).resolves.toBeUndefined();

    expect(prisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { id: 'm-existing' },
        }),
      })
    );
  });
});
