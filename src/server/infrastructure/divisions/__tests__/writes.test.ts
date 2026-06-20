import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assignAthleteToDivision,
  autoAssignAllEligible,
  autoAssignDivision,
  unassignAthleteFromDivision,
} from '@/server/application/divisions/use-cases/assign';
import {
  createDivision,
  deleteDivision,
  updateDivision,
} from '@/server/application/divisions/use-cases/lifecycle';
import { divisionAssignmentStore } from '@/server/infrastructure/divisions/repositories/assign';
import { divisionLifecycleStore } from '@/server/infrastructure/divisions/repositories/lifecycle';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    division: {
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
    vi.mocked(prisma.division.create).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await createDivision(
      {
        name: 'Group A',
        tournamentId: 't1',
      },
      divisionLifecycleStore
    );

    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('publishes once after update', async () => {
    vi.mocked(prisma.division.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'draft' },
    } as never);
    vi.mocked(prisma.division.update).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await updateDivision({ id: 'g1', name: 'Group B' }, divisionLifecycleStore);

    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects deleting a missing group', async () => {
    vi.mocked(prisma.division.findUnique).mockResolvedValue(null);

    await expect(
      deleteDivision({ id: 'missing' }, divisionLifecycleStore)
    ).rejects.toThrow(/Division not found/);

    expect(prisma.division.delete).not.toHaveBeenCalled();
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });

  it('publishes once after delete', async () => {
    vi.mocked(prisma.division.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
      tournament: { status: 'draft' },
    } as never);
    vi.mocked(prisma.division.delete).mockResolvedValue({
      id: 'g1',
      tournamentId: 't1',
    } as never);

    await deleteDivision({ id: 'g1' }, divisionLifecycleStore);

    expect(prisma.division.delete).toHaveBeenCalledWith({
      where: { id: 'g1' },
    });
    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });
});

describe('group autoAssign', () => {
  it('records a single summary activity when athletes are assigned', async () => {
    (prisma.division.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
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

    const result = await autoAssignDivision(
      {
        tournamentId: 't1',
        divisionId: 'g1',
        adminId: 'admin-1',
      },
      divisionAssignmentStore
    );

    expect(result).toEqual({ assigned: 2 });
    expect(recordMutationActivity).toHaveBeenCalledTimes(1);
    expect(recordMutationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        tournamentId: 't1',
        adminId: 'admin-1',
        eventType: 'division.auto_assign',
        entityType: 'division',
        entityId: 'g1',
        payload: { count: 2 },
      }),
      prisma
    );
  });

  it('does not record activity when nothing to assign', async () => {
    (prisma.division.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
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

    const result = await autoAssignDivision(
      {
        tournamentId: 't1',
        divisionId: 'g1',
        adminId: 'admin-1',
      },
      divisionAssignmentStore
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
    (prisma.division.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'g1', _count: { matches: 0 } },
      { id: 'g2', _count: { matches: 2 } },
    ]);
    (prisma.division.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
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
      divisionAssignmentStore
    );

    expect(result).toEqual({
      assigned: 3,
      divisionsRun: 1,
      divisionsSkipped: 1,
    });
    expect(prisma.division.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('assignAthleteToDivision', () => {
  it('records group.athlete_assigned', async () => {
    (prisma.division.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
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
      divisionId: 'g1',
    } as never);

    await assignAthleteToDivision(
      {
        divisionId: 'g1',
        tournamentAthleteId: 'ta1',
        adminId: 'admin-1',
      },
      divisionAssignmentStore
    );

    expect(recordMutationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'division.athlete_assigned',
        entityType: 'tournament_athlete',
        entityId: 'ta1',
        payload: { divisionId: 'g1', name: 'Ada' },
      }),
      prisma
    );
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects assigning an athlete to a group in another tournament', async () => {
    (prisma.division.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
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
      assignAthleteToDivision(
        {
          divisionId: 'g1',
          tournamentAthleteId: 'ta1',
          adminId: 'admin-1',
        },
        divisionAssignmentStore
      )
    ).rejects.toThrow(/does not belong/);

    expect(prisma.tournamentAthlete.update).not.toHaveBeenCalled();
  });
});

describe('unassignAthleteFromDivision', () => {
  it('records group.athlete_unassigned with previous group', async () => {
    (
      prisma.tournamentAthlete.findUnique as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      divisionId: 'g1',
      name: 'Ada',
      tournament: { status: 'draft' },
    } as never);
    (
      prisma.tournamentAthlete.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      name: 'Ada',
      divisionId: null,
    } as never);

    await unassignAthleteFromDivision(
      {
        tournamentAthleteId: 'ta1',
        adminId: 'admin-1',
      },
      divisionAssignmentStore
    );

    expect(recordMutationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'division.athlete_unassigned',
        payload: expect.objectContaining({
          previousDivisionId: 'g1',
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
      unassignAthleteFromDivision(
        {
          tournamentAthleteId: 'missing',
          adminId: 'admin-1',
        },
        divisionAssignmentStore
      )
    ).rejects.toThrow(/not found/);
  });
});
