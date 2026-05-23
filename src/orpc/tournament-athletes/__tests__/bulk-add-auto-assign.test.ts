import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkAddAthletesToTournament } from '../bulk-add';
import { prisma } from '@/lib/db';

const bulkCreate = vi.fn();
const autoAssignAllEligible = vi.fn();

vi.mock('../dal', () => ({
  TournamentAthleteDAL: {
    bulkCreate: (...args: Array<unknown>) => bulkCreate(...args),
  },
}));

vi.mock('@/orpc/groups/dal', () => ({
  GroupDAL: {
    autoAssignAllEligible: (...args: Array<unknown>) =>
      autoAssignAllEligible(...args),
  },
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    athleteProfile: { findMany: vi.fn() },
    tournamentAthlete: { findMany: vi.fn() },
  },
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

describe('bulkAddAthletesToTournament autoAssign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not auto-assign when flag is false', async () => {
    (
      prisma.athleteProfile.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([profile('p1'), profile('p2')]);
    bulkCreate.mockResolvedValue([profile('p1'), profile('p2')]);
    (
      prisma.tournamentAthlete.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ groupId: null }, { groupId: null }]);

    const result = await bulkAddAthletesToTournament({
      tournamentId: 't1',
      athleteProfileIds: ['p1', 'p2'],
      autoAssign: false,
      adminId: 'admin-1',
    });

    expect(autoAssignAllEligible).not.toHaveBeenCalled();
    expect(result).toEqual({ added: 2, assigned: 0, unassigned: 2 });
  });

  it('auto-assigns and counts newly added athletes', async () => {
    (
      prisma.athleteProfile.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([profile('p1'), profile('p2')]);
    bulkCreate.mockResolvedValue([profile('p1'), profile('p2')]);
    autoAssignAllEligible.mockResolvedValue({
      assigned: 5,
      groupsRun: 2,
      groupsSkipped: 0,
    });
    (
      prisma.tournamentAthlete.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ groupId: 'g1' }, { groupId: null }]);

    const result = await bulkAddAthletesToTournament({
      tournamentId: 't1',
      athleteProfileIds: ['p1', 'p2'],
      autoAssign: true,
      adminId: 'admin-1',
    });

    expect(autoAssignAllEligible).toHaveBeenCalledWith({
      tournamentId: 't1',
      adminId: 'admin-1',
    });
    expect(result).toEqual({ added: 2, assigned: 1, unassigned: 1 });
  });
});
