import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkCreate } from '../tournament-athletes.dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    tournamentAthlete: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    athleteProfile: {
      findMany: vi.fn(),
    },
  },
}));

const profile = (id: string) => ({
  id,
  name: `Athlete ${id}`,
  gender: 'M',
  beltLevel: 3,
  weight: 55,
  affiliation: 'Club A',
});

describe('bulkCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates tournament athletes with snapshot fields', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 2,
    });

    const profiles = [profile('p1'), profile('p2')];
    const result = await bulkCreate('tournament-1', profiles);

    expect(prisma.tournamentAthlete.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          tournamentId: 'tournament-1',
          athleteProfileId: 'p1',
          name: 'Athlete p1',
          gender: 'M',
          beltLevel: 3,
          weight: 55,
          affiliation: 'Club A',
          status: 'selected',
        }),
      ]),
    });

    expect(result).toHaveLength(2);
  });

  it('skips athletes already in the tournament', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { athleteProfileId: 'p1' } as never,
    ]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 1,
    });

    const profiles = [profile('p1'), profile('p2')];
    const result = await bulkCreate('tournament-1', profiles);

    const callArgs = vi.mocked(prisma.tournamentAthlete.createMany).mock
      .calls[0]?.[0];
    const data = Array.isArray(callArgs?.data) ? callArgs.data : [];
    expect(data).toHaveLength(1);
    expect(data[0]?.athleteProfileId).toBe('p2');
    expect(result).toHaveLength(1);
  });

  it('returns empty array when all athletes already in tournament', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { athleteProfileId: 'p1' } as never,
      { athleteProfileId: 'p2' } as never,
    ]);

    const profiles = [profile('p1'), profile('p2')];
    const result = await bulkCreate('tournament-1', profiles);

    expect(prisma.tournamentAthlete.createMany).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });
});
