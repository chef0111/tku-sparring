import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tournamentReadStore } from '@/server/infrastructure/tournaments';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    tournament: {
      findUnique: vi.fn(),
    },
    match: {
      count: vi.fn(),
    },
  },
}));

const NOW = new Date('2026-05-01T10:00:00.000Z');

function tournamentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tournament-1',
    name: 'Spring Open',
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
    groups: [
      {
        id: 'group-1',
        name: 'Group A',
        _count: {
          tournamentAthletes: 2,
          matches: 1,
        },
      },
    ],
    _count: {
      groups: 1,
      matches: 1,
      tournamentAthletes: 2,
    },
    ...overrides,
  };
}

describe('tournaments DAL', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a completion-ready lifecycle flag when every group has resolved matches', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournamentRecord({
        status: 'active',
        groups: [
          {
            id: 'group-1',
            name: 'Group A',
            _count: { tournamentAthletes: 2, matches: 1 },
          },
          {
            id: 'group-2',
            name: 'Group B',
            _count: { tournamentAthletes: 2, matches: 2 },
          },
        ],
        _count: {
          groups: 2,
          matches: 3,
          tournamentAthletes: 4,
        },
      }) as never
    );
    vi.mocked(prisma.match.count).mockResolvedValue(3);

    const result = await tournamentReadStore.findById('tournament-1');

    expect(result).toMatchObject({
      id: 'tournament-1',
      lifecycle: {
        canComplete: true,
      },
    });
    expect(prisma.match.count).toHaveBeenCalledWith({
      where: {
        tournamentId: 'tournament-1',
        winnerId: { not: null },
      },
    });
  });

  it('returns a blocked lifecycle flag when any group has no matches yet', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournamentRecord({
        status: 'active',
        groups: [
          {
            id: 'group-1',
            name: 'Group A',
            _count: { tournamentAthletes: 2, matches: 1 },
          },
          {
            id: 'group-2',
            name: 'Group B',
            _count: { tournamentAthletes: 2, matches: 0 },
          },
        ],
        _count: {
          groups: 2,
          matches: 1,
          tournamentAthletes: 4,
        },
      }) as never
    );

    const result = await tournamentReadStore.findById('tournament-1');

    expect(result).toMatchObject({
      lifecycle: {
        canComplete: false,
      },
    });
    expect(prisma.match.count).not.toHaveBeenCalled();
  });
});
