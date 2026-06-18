import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getGroup,
  listGroupsByTournament,
} from '@/server/application/groups/use-cases/read';
import { groupReadStore } from '@/server/infrastructure/groups';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    group: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('groupReadStore', () => {
  it('lists groups for a tournament ordered by createdAt', async () => {
    vi.mocked(prisma.group.findMany).mockResolvedValue([
      { id: 'g1', name: 'Group A' },
    ] as never);

    await listGroupsByTournament('t1', groupReadStore);

    expect(prisma.group.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tournamentId: 't1' },
        orderBy: { createdAt: 'asc' },
      })
    );
  });

  it('loads group detail with athletes and matches', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'g1',
      tournamentAthletes: [],
      matches: [],
    } as never);

    await getGroup('g1', groupReadStore);

    expect(prisma.group.findUnique).toHaveBeenCalledWith(
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
    vi.mocked(prisma.group.findUnique).mockResolvedValue(null);

    await expect(getGroup('missing', groupReadStore)).rejects.toThrow(
      /not found/i
    );
  });
});
