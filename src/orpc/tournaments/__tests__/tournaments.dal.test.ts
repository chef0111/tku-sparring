import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findById, setStatus } from '../tournaments.dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    tournament: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    match: {
      count: vi.fn(),
    },
    tournamentActivity: {
      create: vi.fn(),
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

    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(prisma as never);
      }

      return callback;
    });
    vi.mocked(prisma.tournamentActivity.create).mockResolvedValue({} as never);
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

    const result = await findById('tournament-1');

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

    const result = await findById('tournament-1');

    expect(result).toMatchObject({
      lifecycle: {
        canComplete: false,
      },
    });
    expect(prisma.match.count).not.toHaveBeenCalled();
  });

  it('activates a draft tournament and records an audit row', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournamentRecord() as never
    );
    vi.mocked(prisma.tournament.update).mockResolvedValue({
      id: 'tournament-1',
      status: 'active',
    } as never);

    const result = await setStatus({
      id: 'tournament-1',
      status: 'active',
      adminId: 'admin-1',
    });

    expect(prisma.tournament.update).toHaveBeenCalledWith({
      where: { id: 'tournament-1' },
      data: { status: 'active' },
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-1',
        eventType: 'tournament.status_change',
        entityType: 'tournament',
        entityId: 'tournament-1',
        payload: {
          fromStatus: 'draft',
          toStatus: 'active',
        },
      }),
    });
    expect(result).toEqual({
      id: 'tournament-1',
      status: 'active',
    });
  });

  it('completes an active tournament and records the completion activity payload', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournamentRecord({
        status: 'active',
      }) as never
    );
    vi.mocked(prisma.match.count).mockResolvedValue(1);
    vi.mocked(prisma.tournament.update).mockResolvedValue({
      id: 'tournament-1',
      status: 'completed',
    } as never);

    const result = await setStatus({
      id: 'tournament-1',
      status: 'completed',
      adminId: 'admin-1',
    });

    expect(prisma.match.count).toHaveBeenCalledWith({
      where: {
        tournamentId: 'tournament-1',
        winnerId: { not: null },
      },
    });
    expect(prisma.tournament.update).toHaveBeenCalledWith({
      where: { id: 'tournament-1' },
      data: { status: 'completed' },
    });
    expect(prisma.tournamentActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 'tournament-1',
        adminId: 'admin-1',
        eventType: 'tournament.status_change',
        payload: {
          fromStatus: 'active',
          toStatus: 'completed',
        },
      }),
    });
    expect(result).toEqual({
      id: 'tournament-1',
      status: 'completed',
    });
  });

  it('rejects skipping directly from draft to completed', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournamentRecord() as never
    );

    await expect(
      setStatus({
        id: 'tournament-1',
        status: 'completed',
        adminId: 'admin-1',
      })
    ).rejects.toThrow('Tournament status must advance one step at a time');

    expect(prisma.tournament.update).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
  });

  it('rejects completion until every group has winner results', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      tournamentRecord({
        status: 'active',
        groups: [
          {
            id: 'group-1',
            name: 'Group A',
            _count: { tournamentAthletes: 2, matches: 1 },
          },
        ],
        _count: {
          groups: 1,
          matches: 1,
          tournamentAthletes: 2,
        },
      }) as never
    );
    vi.mocked(prisma.match.count).mockResolvedValue(0);

    await expect(
      setStatus({
        id: 'tournament-1',
        status: 'completed',
        adminId: 'admin-1',
      })
    ).rejects.toThrow(
      'Tournament cannot be completed until every group has winner results'
    );

    expect(prisma.tournament.update).not.toHaveBeenCalled();
    expect(prisma.tournamentActivity.create).not.toHaveBeenCalled();
  });
});
