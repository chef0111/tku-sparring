import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assignAthleteToGroup,
  autoAssignAllEligible,
  autoAssignGroup,
  unassignAthleteFromGroup,
} from '@/server/application/groups/use-cases/assign';
import {
  createGroup,
  deleteGroup,
  updateGroup,
} from '@/server/application/groups/use-cases/lifecycle';
import { groupAssignmentStore } from '@/server/infrastructure/groups/repositories/assign';
import { groupLifecycleStore } from '@/server/infrastructure/groups/repositories/lifecycle';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
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

vi.mock('@/server/infrastructure/mutation-effects', () => ({
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

describe('group lifecycle writes', () => {
  it('publishes once after create', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'draft',
    } as never);
    vi.mocked(prisma.group.create).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await createGroup(
      {
        name: 'Group A',
        tournamentId: 't1',
      },
      groupLifecycleStore
    );

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

    await updateGroup({ id: 'g1', name: 'Group B' }, groupLifecycleStore);

    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects deleting a missing group', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(null);

    await expect(
      deleteGroup({ id: 'missing' }, groupLifecycleStore)
    ).rejects.toThrow(/Group not found/);

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

    await deleteGroup({ id: 'g1' }, groupLifecycleStore);

    expect(prisma.group.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects create outside draft tournaments', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'active',
    } as never);

    await expect(
      createGroup({ name: 'Group A', tournamentId: 't1' }, groupLifecycleStore)
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

    await expect(
      updateGroup({ id: 'g1', name: 'Group B' }, groupLifecycleStore)
    ).rejects.toThrow(/read-only/);

    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  it('rejects delete outside draft tournaments', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'active' },
    } as never);

    await expect(
      deleteGroup({ id: 'g1' }, groupLifecycleStore)
    ).rejects.toThrow(/Draft status/);

    expect(prisma.group.delete).not.toHaveBeenCalled();
  });
});

describe('group autoAssign', () => {
  it('records a single summary activity when athletes are assigned', async () => {
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
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

    const result = await autoAssignGroup(
      {
        tournamentId: 't1',
        groupId: 'g1',
        adminId: 'admin-1',
      },
      groupAssignmentStore
    );

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
      tournamentId: 't1',
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

    const result = await autoAssignGroup(
      {
        tournamentId: 't1',
        groupId: 'g1',
        adminId: 'admin-1',
      },
      groupAssignmentStore
    );

    expect(result).toEqual({ assigned: 0 });
    expect(recordMutationActivity).not.toHaveBeenCalled();
  });
});

describe('autoAssignAllEligible', () => {
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
      tournamentId: 't1',
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

    const result = await autoAssignAllEligible(
      {
        tournamentId: 't1',
        adminId: 'admin-1',
      },
      groupAssignmentStore
    );

    expect(result).toEqual({ assigned: 3, groupsRun: 1, groupsSkipped: 1 });
    expect(prisma.group.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('assignAthleteToGroup', () => {
  it('records group.athlete_assigned', async () => {
    (prisma.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
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

    await assignAthleteToGroup(
      {
        groupId: 'g1',
        tournamentAthleteId: 'ta1',
        adminId: 'admin-1',
      },
      groupAssignmentStore
    );

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
      gender: null,
      beltMin: null,
      beltMax: null,
      weightMin: null,
      weightMax: null,
      tournament: { status: 'draft' },
    } as never);
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't2',
    } as never);

    await expect(
      assignAthleteToGroup(
        {
          groupId: 'g1',
          tournamentAthleteId: 'ta1',
          adminId: 'admin-1',
        },
        groupAssignmentStore
      )
    ).rejects.toThrow(/does not belong/);

    expect(prisma.tournamentAthlete.update).not.toHaveBeenCalled();
  });
});

describe('unassignAthleteFromGroup', () => {
  it('records group.athlete_unassigned with previous group', async () => {
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      groupId: 'g1',
      name: 'Ada',
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

    await unassignAthleteFromGroup(
      {
        tournamentAthleteId: 'ta1',
        adminId: 'admin-1',
      },
      groupAssignmentStore
    );

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
      unassignAthleteFromGroup(
        {
          tournamentAthleteId: 'missing',
          adminId: 'admin-1',
        },
        groupAssignmentStore
      )
    ).rejects.toThrow(/not found/);
  });
});
