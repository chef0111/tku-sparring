import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findTournamentById } from '../tournament-lifecycle';
import {
  moveGroupBetweenArenas,
  setArenaGroupOrder,
} from '@/server/application/tournaments/use-cases/arena-order';
import { tournamentArenaOrderStore } from '@/server/infrastructure/tournaments';
import { prisma } from '@/lib/db';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';

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

vi.mock('@/server/infrastructure/mutation-effects', () => ({
  publishTournamentMutation: vi.fn(),
  recordMutationActivity: vi.fn(),
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

describe('tournament arena order infrastructure', () => {
  it('guards arena order mutations to draft tournaments', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      ...draftTournament,
      status: 'active',
    } as never);

    await expect(
      setArenaGroupOrder(
        {
          tournamentId: 't1',
          arenaIndex: 1,
          groupIds: ['g1', 'g2'],
        },
        tournamentArenaOrderStore
      )
    ).rejects.toThrow(/Draft status/);

    expect(prisma.tournament.update).not.toHaveBeenCalled();
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });

  it('requires same-arena reorder to include every group exactly once', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      draftTournament as never
    );

    await expect(
      setArenaGroupOrder(
        {
          tournamentId: 't1',
          arenaIndex: 1,
          groupIds: ['g1'],
        },
        tournamentArenaOrderStore
      )
    ).rejects.toThrow(/exactly once/);

    await expect(
      setArenaGroupOrder(
        {
          tournamentId: 't1',
          arenaIndex: 1,
          groupIds: ['g1', 'g3'],
        },
        tournamentArenaOrderStore
      )
    ).rejects.toThrow(/exactly once/);
  });

  it('updates group arena and arena order in one transaction for cross-arena moves', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue(
      draftTournament as never
    );

    await moveGroupBetweenArenas(
      {
        tournamentId: 't1',
        groupId: 'g2',
        fromArena: 1,
        toArena: 2,
        insertIndex: 1,
      },
      tournamentArenaOrderStore
    );

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

    await setArenaGroupOrder(
      {
        tournamentId: 't1',
        arenaIndex: 1,
        groupIds: ['g2', 'g1'],
      },
      tournamentArenaOrderStore
    );

    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });
});
