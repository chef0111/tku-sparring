import { beforeEach, describe, expect, it, vi } from 'vitest';

import { arenaMatchClaimStore } from '@/server/infrastructure/arena-match-claim';
import { prisma } from '@/lib/db';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';

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

vi.mock('@/server/infrastructure/mutation-effects', () => ({
  publishTournamentMutation: vi.fn(),
  recordMutationActivity: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(tx.arenaMatchClaim.deleteMany).mockResolvedValue({ count: 0 });
  vi.mocked(tx.arenaMatchClaim.findMany).mockResolvedValue([]);
});

describe('arenaMatchClaimStore.claim', () => {
  it('runs claim lifecycle in one transaction before publishing', async () => {
    vi.mocked(prisma.arenaMatchClaim.deleteMany).mockResolvedValue({
      count: 0,
    } as never);

    vi.mocked(tx.match.findUnique).mockResolvedValue({
      id: 'm1',
      groupId: 'g1',
      tournamentId: 't1',
      status: 'pending',
      tournament: { status: 'active' },
    } as never);

    vi.mocked(tx.arenaMatchClaim.findUnique).mockResolvedValue(null);
    vi.mocked(tx.arenaMatchClaim.upsert).mockResolvedValue({
      matchId: 'm1',
      deviceId: 'd1',
    } as never);
    vi.mocked(tx.match.update).mockResolvedValue({ id: 'm1' } as never);

    await arenaMatchClaimStore.claim({
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
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects completed tournaments before claim writes', async () => {
    vi.mocked(tx.match.findUnique).mockResolvedValue({
      id: 'm1',
      groupId: 'g1',
      tournamentId: 't1',
      status: 'pending',
      tournament: { status: 'completed' },
    } as never);

    await expect(
      arenaMatchClaimStore.claim({
        matchId: 'm1',
        groupId: 'g1',
        tournamentId: 't1',
        deviceId: 'd1',
        userId: 'u1',
      })
    ).rejects.toThrow(/read-only/);

    expect(tx.arenaMatchClaim.upsert).not.toHaveBeenCalled();
    expect(tx.match.update).not.toHaveBeenCalled();
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });
});

describe('arenaMatchClaimStore.release', () => {
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
      tournament: { status: 'active' },
    } as never);
    vi.mocked(tx.arenaMatchClaim.delete).mockResolvedValue({} as never);
    vi.mocked(tx.match.update).mockResolvedValue({ id: 'm1' } as never);

    await arenaMatchClaimStore.release({
      matchId: 'm1',
      deviceId: 'd1',
      userId: 'u1',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.arenaMatchClaim.delete).toHaveBeenCalled();
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects completed tournaments before release writes', async () => {
    vi.mocked(tx.arenaMatchClaim.findUnique).mockResolvedValue({
      matchId: 'm1',
      deviceId: 'd1',
      tournamentId: 't1',
    } as never);
    vi.mocked(tx.match.findUnique).mockResolvedValue({
      redWins: 1,
      blueWins: 0,
      status: 'active',
      tournament: { status: 'completed' },
    } as never);

    await expect(
      arenaMatchClaimStore.release({
        matchId: 'm1',
        deviceId: 'd1',
        userId: 'u1',
      })
    ).rejects.toThrow(/read-only/);

    expect(tx.arenaMatchClaim.delete).not.toHaveBeenCalled();
    expect(tx.match.update).not.toHaveBeenCalled();
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });
});
