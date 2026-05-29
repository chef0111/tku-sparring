import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArenaMatchClaimDAL } from '../dal';
import { prisma } from '@/lib/db';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-sse-bus';

const tx = {
  arenaMatchClaim: {
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  match: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  prisma: {
    arenaMatchClaim: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx)
    ),
  },
}));

vi.mock('@/lib/tournament/tournament-sse-bus', () => ({
  publishSelectionInvalidate: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(tx.arenaMatchClaim.deleteMany).mockResolvedValue({ count: 0 });
  vi.mocked(tx.arenaMatchClaim.findMany).mockResolvedValue([]);
});

describe('ArenaMatchClaimDAL.claim', () => {
  it('runs claim lifecycle in one transaction before publishing', async () => {
    vi.mocked(prisma.arenaMatchClaim.deleteMany).mockResolvedValue({
      count: 0,
    } as never);

    vi.mocked(tx.match.findUnique).mockResolvedValue({
      id: 'm1',
      groupId: 'g1',
      tournamentId: 't1',
      status: 'pending',
    } as never);

    vi.mocked(tx.arenaMatchClaim.findUnique).mockResolvedValue(null);
    vi.mocked(tx.arenaMatchClaim.upsert).mockResolvedValue({
      matchId: 'm1',
      deviceId: 'd1',
    } as never);
    vi.mocked(tx.match.update).mockResolvedValue({ id: 'm1' } as never);

    await ArenaMatchClaimDAL.claim({
      matchId: 'm1',
      groupId: 'g1',
      tournamentId: 't1',
      deviceId: 'd1',
      userId: 'u1',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.arenaMatchClaim.upsert).toHaveBeenCalled();
    expect(tx.match.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'active' },
    });
    expect(publishSelectionInvalidate).toHaveBeenCalledWith('t1');
  });
});

describe('ArenaMatchClaimDAL.release', () => {
  it('runs release lifecycle in one transaction before publishing', async () => {
    vi.mocked(tx.arenaMatchClaim.findUnique).mockResolvedValue({
      matchId: 'm1',
      deviceId: 'd1',
      tournamentId: 't1',
    } as never);
    vi.mocked(tx.match.findUnique).mockResolvedValue({
      redWins: 1,
      blueWins: 0,
      status: 'active',
    } as never);
    vi.mocked(tx.arenaMatchClaim.delete).mockResolvedValue({} as never);
    vi.mocked(tx.match.update).mockResolvedValue({ id: 'm1' } as never);

    await ArenaMatchClaimDAL.release({
      matchId: 'm1',
      deviceId: 'd1',
      userId: 'u1',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.arenaMatchClaim.delete).toHaveBeenCalled();
    expect(publishSelectionInvalidate).toHaveBeenCalledWith('t1');
  });
});
