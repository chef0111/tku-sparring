import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupDAL } from '../dal';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    group: { findUnique: vi.fn(), findMany: vi.fn() },
    tournamentAthlete: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/orpc/mutation-effects', () => ({
  recordMutationActivity: vi.fn(),
  publishTournamentMutation: vi.fn(),
}));

vi.mock('@/orpc/activity/dal', () => ({
  recordTournamentActivity: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    async (fn) => {
      return (fn as (tx: typeof prisma) => Promise<unknown>)(prisma);
    }
  );
});

describe('GroupDAL autoAssign', () => {
  it('records a single summary activity when athletes are assigned', async () => {
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
    } as never);
    (
      prisma.tournamentAthlete.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'ta1' }, { id: 'ta2' }] as never);
    (
      prisma.tournamentAthlete.updateMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
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
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
    } as never);
    (
      prisma.tournamentAthlete.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const result = await GroupDAL.autoAssign({
      tournamentId: 't1',
      groupId: 'g1',
      adminId: 'admin-1',
    });

    expect(result).toEqual({ assigned: 0 });
    expect(recordTournamentActivity).not.toHaveBeenCalled();
  });
});

describe('GroupDAL autoAssignAllEligible', () => {
  it('skips groups that already have matches', async () => {
    (prisma.group.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'g1', _count: { matches: 0 } },
      { id: 'g2', _count: { matches: 2 } },
    ]);
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
    });
    (
      prisma.tournamentAthlete.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: 'ta1' }, { id: 'ta2' }, { id: 'ta3' }]);
    (
      prisma.tournamentAthlete.updateMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ count: 3 });

    const result = await GroupDAL.autoAssignAllEligible({
      tournamentId: 't1',
      adminId: 'admin-1',
    });

    expect(result).toEqual({ assigned: 3, groupsRun: 1, groupsSkipped: 1 });
    expect(prisma.group.findUnique).toHaveBeenCalledTimes(1);
  });
});

describe('GroupDAL assignAthlete', () => {
  it('records group.athlete_assigned', async () => {
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
    } as never);
    (
      prisma.tournamentAthlete.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
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

    expect(recordMutationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'group.athlete_assigned',
        entityType: 'tournament_athlete',
        entityId: 'ta1',
        payload: { groupId: 'g1', name: 'Ada' },
      }),
      prisma
    );
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects assigning an athlete to a group in another tournament', async () => {
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't2',
    } as never);

    await expect(
      GroupDAL.assignAthlete({
        groupId: 'g1',
        tournamentAthleteId: 'ta1',
        adminId: 'admin-1',
      })
    ).rejects.toThrow(/does not belong/);

    expect(prisma.tournamentAthlete.update).not.toHaveBeenCalled();
  });
});

describe('GroupDAL unassignAthlete', () => {
  it('records group.athlete_unassigned with previous group', async () => {
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      groupId: 'g1',
    } as never);
    (
      prisma.tournamentAthlete.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      name: 'Ada',
      groupId: null,
    } as never);

    await GroupDAL.unassignAthlete({
      tournamentAthleteId: 'ta1',
      adminId: 'admin-1',
    });

    expect(recordMutationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'group.athlete_unassigned',
        payload: expect.objectContaining({
          previousGroupId: 'g1',
          name: 'Ada',
        }),
      }),
      prisma
    );
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('throws when athlete is missing', async () => {
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    await expect(
      GroupDAL.unassignAthlete({
        tournamentAthleteId: 'missing',
        adminId: 'admin-1',
      })
    ).rejects.toThrow(/not found/);
  });
});
