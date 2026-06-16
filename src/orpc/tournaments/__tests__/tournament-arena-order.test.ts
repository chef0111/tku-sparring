import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  moveGroupBetweenArenas,
  setArenaGroupOrder,
} from '../tournament-arena-order';
import { findTournamentById } from '../tournament-lifecycle';
import { prisma } from '@/lib/db';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-realtime-broadcast';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    group: {
      update: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../tournament-lifecycle', () => ({
  findTournamentById: vi.fn(),
}));

vi.mock('@/lib/tournament/tournament-realtime-broadcast', () => ({
  publishSelectionInvalidate: vi.fn(),
}));

const draftTournament = {
  id: 't1',
  status: 'draft',
  arenaGroupOrder: { '1': ['g1', 'g2'], '2': ['g3'] },
  groups: [
    { id: 'g1', arenaIndex: 1 },
    { id: 'g2', arenaIndex: 1 },
    { id: 'g3', arenaIndex: 2 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findTournamentById).mockResolvedValue({
    id: 't1',
    name: 'Tournament',
  } as never);
  vi.mocked(prisma.tournament.update).mockReturnValue({
    op: 'tournament',
  } as never);
  vi.mocked(prisma.group.update).mockReturnValue({ op: 'group' } as never);
  vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
});

describe('tournament arena order', () => {
  it('guards arena order mutations to draft tournaments', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      ...draftTournament,
      status: 'active',
    } as never);

    await expect(
      setArenaGroupOrder({
        tournamentId: 't1',
        arenaIndex: 1,
        groupIds: ['g1', 'g2'],
      })
    ).rejects.toThrow(/Draft status/);

    expect(prisma.tournament.update).not.toHaveBeenCalled();
    expect(publishSelectionInvalidate).not.toHaveBeenCalled();
  });

  it('requires same-arena reorder to include every group exactly once', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      draftTournament as never
    );

    await expect(
      setArenaGroupOrder({
        tournamentId: 't1',
        arenaIndex: 1,
        groupIds: ['g1'],
      })
    ).rejects.toThrow(/exactly once/);

    await expect(
      setArenaGroupOrder({
        tournamentId: 't1',
        arenaIndex: 1,
        groupIds: ['g1', 'g3'],
      })
    ).rejects.toThrow(/exactly once/);
  });

  it('updates group arena and arena order in one transaction for cross-arena moves', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      draftTournament as never
    );

    await moveGroupBetweenArenas({
      tournamentId: 't1',
      groupId: 'g2',
      fromArena: 1,
      toArena: 2,
      insertIndex: 1,
    });

    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: 'g2' },
      data: { arenaIndex: 2 },
    });
    expect(prisma.tournament.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { arenaGroupOrder: { '1': ['g1'], '2': ['g3', 'g2'] } },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      { op: 'group' },
      { op: 'tournament' },
    ]);
  });

  it('publishes once after each successful mutation', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      draftTournament as never
    );

    await setArenaGroupOrder({
      tournamentId: 't1',
      arenaIndex: 1,
      groupIds: ['g2', 'g1'],
    });

    expect(publishSelectionInvalidate).toHaveBeenCalledTimes(1);
    expect(publishSelectionInvalidate).toHaveBeenCalledWith('t1');
  });
});
