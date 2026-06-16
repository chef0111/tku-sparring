import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupDAL } from '../dal';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    group: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
    },
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

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    async (fn) => {
      return (fn as (tx: typeof prisma) => Promise<unknown>)(prisma);
    }
  );
});

describe('GroupDAL writes', () => {
  it('publishes once after create', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'draft',
    } as never);
    vi.mocked(prisma.group.create).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await GroupDAL.create({
      name: 'Group A',
      tournamentId: 't1',
    } as never);

    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('publishes once after update', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'draft' },
    } as never);
    vi.mocked(prisma.group.update).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await GroupDAL.update('g1', { name: 'Group B' } as never);

    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects deleting a missing group', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(null);

    await expect(GroupDAL.deleteGroup('missing')).rejects.toThrow(
      /Group not found/
    );

    expect(prisma.group.delete).not.toHaveBeenCalled();
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });

  it('publishes once after delete', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'draft' },
    } as never);
    vi.mocked(prisma.group.delete).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await GroupDAL.deleteGroup('g1');

    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects create outside draft tournaments', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'active',
    } as never);

    await expect(
      GroupDAL.create({ name: 'Group A', tournamentId: 't1' } as never)
    ).rejects.toThrow(/Draft status/);

    expect(prisma.group.create).not.toHaveBeenCalled();
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });

  it('rejects update on completed tournaments', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'completed' },
    } as never);

    await expect(GroupDAL.update('g1', { name: 'Group B' })).rejects.toThrow(
      /read-only/
    );

    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  it('rejects delete outside draft tournaments', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'active' },
    } as never);

    await expect(GroupDAL.deleteGroup('g1')).rejects.toThrow(/Draft status/);

    expect(prisma.group.delete).not.toHaveBeenCalled();
  });
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
      tournament: { status: 'draft' },
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
    expect(recordMutationActivity).toHaveBeenCalledTimes(1);
    expect(recordMutationActivity).toHaveBeenCalledWith(
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
      tournament: { status: 'draft' },
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
    expect(recordMutationActivity).not.toHaveBeenCalled();
  });
});

describe('GroupDAL autoAssignAllEligible', () => {
  it('skips groups that already have matches', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'draft',
    } as never);
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
      tournament: { status: 'draft' },
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
      tournament: { status: 'draft' },
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
      tournament: { status: 'draft' },
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
      tournament: { status: 'draft' },
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
