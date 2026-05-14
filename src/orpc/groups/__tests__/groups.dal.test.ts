import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupDAL } from '../dal';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    group: { findUnique: vi.fn() },
    tournamentAthlete: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/orpc/activity/dal', () => ({
  recordTournamentActivity: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
    return (fn as (tx: typeof prisma) => Promise<unknown>)(prisma);
  });
});

describe('GroupDAL autoAssign', () => {
  it('records a single summary activity when athletes are assigned', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
    } as never);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta1' },
      { id: 'ta2' },
    ] as never);
    vi.mocked(prisma.tournamentAthlete.updateMany).mockResolvedValue({
      count: 2,
    } as never);

    const result = await GroupDAL.autoAssign({
      tournamentId: 't1',
      groupId: 'g1',
      adminId: 'admin-1',
    });

    expect(result).toEqual({ assigned: 2 });
    expect(recordTournamentActivity).toHaveBeenCalledTimes(1);
    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        tournamentId: 't1',
        adminId: 'admin-1',
        eventType: 'group.auto_assign',
        entityType: 'group',
        entityId: 'g1',
        payload: { count: 2 },
      }),
      prisma
    );
  });

  it('does not record activity when nothing to assign', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
    } as never);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([]);

    const result = await GroupDAL.autoAssign({
      tournamentId: 't1',
      groupId: 'g1',
      adminId: 'admin-1',
    });

    expect(result).toEqual({ assigned: 0 });
    expect(recordTournamentActivity).not.toHaveBeenCalled();
  });
});

describe('GroupDAL assignAthlete', () => {
  it('records group.athlete_assigned', async () => {
    vi.mocked(prisma.tournamentAthlete.update).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      name: 'Ada',
      groupId: 'g1',
    } as never);

    await GroupDAL.assignAthlete({
      groupId: 'g1',
      tournamentAthleteId: 'ta1',
      adminId: 'admin-1',
    });

    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'group.athlete_assigned',
        entityType: 'tournament_athlete',
        entityId: 'ta1',
        payload: { groupId: 'g1', name: 'Ada' },
      }),
      prisma
    );
  });
});

describe('GroupDAL unassignAthlete', () => {
  it('records group.athlete_unassigned with previous group', async () => {
    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta1',
      groupId: 'g1',
    } as never);
    vi.mocked(prisma.tournamentAthlete.update).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      name: 'Ada',
      groupId: null,
    } as never);

    await GroupDAL.unassignAthlete({
      tournamentAthleteId: 'ta1',
      adminId: 'admin-1',
    });

    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'group.athlete_unassigned',
        payload: expect.objectContaining({
          previousGroupId: 'g1',
          name: 'Ada',
        }),
      }),
      prisma
    );
  });

  it('throws when athlete is missing', async () => {
    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue(null);

    await expect(
      GroupDAL.unassignAthlete({
        tournamentAthleteId: 'missing',
        adminId: 'admin-1',
      })
    ).rejects.toThrow(/not found/);
  });
});
