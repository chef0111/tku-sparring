import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkAddAthletes } from '../bulk-add';
import type { GroupAssignmentStore } from '@/server/application/groups/repositories/assign';
import type { TournamentAthleteStore } from '../../repositories/roster';

const autoAssignAllEligible = vi.fn();

vi.mock('@/server/application/groups/use-cases/assign', () => ({
  autoAssignAllEligible: (...args: Array<unknown>) =>
    autoAssignAllEligible(...args),
}));

const profile = (id: string) => ({
  id,
  name: `Athlete ${id}`,
  gender: 'M',
  beltLevel: 3,
  weight: 55,
  affiliation: 'Club',
  image: null,
});

function fakeStore(over: Partial<TournamentAthleteStore> = {}) {
  const store: TournamentAthleteStore = {
    list: vi.fn(),
    findProfilesByIds: vi.fn(),
    bulkCreate: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    bulkRemove: vi.fn(),
    countAssigned: vi.fn(),
    ...over,
  };
  return store;
}

const assignStore = {} as GroupAssignmentStore;

describe('bulkAddAthletes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not auto-assign when flag is false', async () => {
    const store = fakeStore({
      findProfilesByIds: vi
        .fn()
        .mockResolvedValue([profile('p1'), profile('p2')]),
      bulkCreate: vi.fn().mockResolvedValue([profile('p1'), profile('p2')]),
      countAssigned: vi.fn().mockResolvedValue(0),
    });

    const result = await bulkAddAthletes(
      {
        tournamentId: 't1',
        athleteProfileIds: ['p1', 'p2'],
        autoAssign: false,
        adminId: 'admin-1',
      },
      store,
      assignStore
    );

    expect(autoAssignAllEligible).not.toHaveBeenCalled();
    expect(result).toEqual({ added: 2, assigned: 0, unassigned: 2 });
  });

  it('auto-assigns and counts newly added athletes', async () => {
    const store = fakeStore({
      findProfilesByIds: vi
        .fn()
        .mockResolvedValue([profile('p1'), profile('p2')]),
      bulkCreate: vi.fn().mockResolvedValue([profile('p1'), profile('p2')]),
      countAssigned: vi.fn().mockResolvedValue(1),
    });
    autoAssignAllEligible.mockResolvedValue({
      assigned: 5,
      groupsRun: 2,
      groupsSkipped: 0,
    });

    const result = await bulkAddAthletes(
      {
        tournamentId: 't1',
        athleteProfileIds: ['p1', 'p2'],
        autoAssign: true,
        adminId: 'admin-1',
      },
      store,
      assignStore
    );

    expect(autoAssignAllEligible).toHaveBeenCalledWith(
      { tournamentId: 't1', adminId: 'admin-1' },
      assignStore
    );
    expect(result).toEqual({ added: 2, assigned: 1, unassigned: 1 });
  });
});
