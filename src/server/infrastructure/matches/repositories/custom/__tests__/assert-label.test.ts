import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assertLabelAvailable } from '@/server/infrastructure/matches/repositories/custom/assert-label';
import { loadMatchLabelContext } from '@/server/infrastructure/tournament/match-label-context';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/server/infrastructure/tournament/match-label-context', () => ({
  loadMatchLabelContext: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.match.findMany).mockResolvedValue([]);
  vi.mocked(loadMatchLabelContext).mockResolvedValue({
    arenaIndex: 1,
    divisionIdsOnArena: ['g1'],
    allMatches: [],
    numbers: new Map(),
    assignedBracketTitleKeys: new Set(),
  });
});

describe('assertLabelAvailable', () => {
  it('permits editing the same custom match label when excluded', async () => {
    await expect(
      assertLabelAvailable({
        tournamentId: 't1',
        divisionId: 'g1',
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
