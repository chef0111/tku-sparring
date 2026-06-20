import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDivision,
  listDivisionsByTournament,
} from '@/server/application/divisions/use-cases/read';
import { divisionReadStore } from '@/server/infrastructure/divisions';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    division: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('divisionReadStore', () => {
  it('lists groups for a tournament ordered by createdAt', async () => {
    vi.mocked(prisma.division.findMany).mockResolvedValue([
      { id: 'g1', name: 'Group A' },
    ] as never);

    await listDivisionsByTournament('t1', divisionReadStore);

    expect(prisma.division.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tournamentId: 't1' },
        orderBy: { createdAt: 'asc' },
      })
    );
  });

  it('loads group detail with athletes and matches', async () => {
    vi.mocked(prisma.division.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentAthletes: [],
      matches: [],
    } as never);

    await getDivision('g1', divisionReadStore);

    expect(prisma.division.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        include: expect.objectContaining({
          tournamentAthletes: expect.any(Object),
          matches: true,
        }),
      })
    );
  });

  it('throws when group is missing', async () => {
    vi.mocked(prisma.division.findUnique).mockResolvedValue(null);

    await expect(getDivision('missing', divisionReadStore)).rejects.toThrow(
      /not found/i
    );
  });
});
