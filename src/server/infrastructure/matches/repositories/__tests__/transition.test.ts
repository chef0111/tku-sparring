import { beforeEach, describe, expect, it, vi } from 'vitest';

import { matchTransitionStore } from '../transition';
import {
  advanceWinner,
  clearWinnerAdvancement,
} from '@/orpc/matches/match-progression';
import { prisma } from '@/lib/db';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/orpc/mutation-effects';

const tx = {
  match: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  tournamentActivity: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx)
    ),
  },
}));

vi.mock('@/orpc/matches/match-progression', () => ({
  clearWinnerAdvancement: vi.fn(),
  advanceWinner: vi.fn(),
}));

vi.mock('@/orpc/mutation-effects', () => ({
  recordMutationActivity: vi.fn(),
  publishTournamentMutation: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('matchTransitionStore', () => {
  it('runs transition effects inside one transaction and publishes after success', async () => {
    const match = {
      id: 'm1',
      tournamentId: 't-1',
      groupId: 'g-1',
      round: 0,
      matchIndex: 0,
      tournamentWinnerId: 'ta-red',
      kind: 'bracket',
      displayLabel: null,
    };

    vi.mocked(tx.match.findUnique).mockResolvedValue(match as never);
    vi.mocked(tx.match.update).mockResolvedValue({
      ...match,
      status: 'complete',
      tournamentWinnerId: 'ta-red',
    } as never);
    vi.mocked(tx.tournamentActivity.create).mockResolvedValue({} as never);

    await matchTransitionStore.applyTransition({
      matchId: 'm1',
      plan: {
        data: { status: 'complete', tournamentWinnerId: 'ta-red' },
        clearAdvancement: true,
        advancedWinnerId: 'ta-red',
      },
      adminId: 'admin-1',
      activity: {
        eventType: 'match.score_edit',
        payload: { status: 'complete' },
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(clearWinnerAdvancement).toHaveBeenCalledWith(match, tx);
    expect(tx.match.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'complete', tournamentWinnerId: 'ta-red' },
    });
    expect(advanceWinner).toHaveBeenCalledWith('m1', 'ta-red', tx);
    expect(recordMutationActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        tournamentId: 't-1',
        eventType: 'match.score_edit',
      }),
      tx
    );
    expect(publishTournamentMutation).toHaveBeenCalledWith('t-1');
    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);

    const clearOrder = vi.mocked(clearWinnerAdvancement).mock
      .invocationCallOrder[0];
    const updateOrder = vi.mocked(tx.match.update).mock.invocationCallOrder[0];
    const advanceOrder = vi.mocked(advanceWinner).mock.invocationCallOrder[0];
    const activityOrder = vi.mocked(recordMutationActivity).mock
      .invocationCallOrder[0];
    const publishOrder = vi.mocked(publishTournamentMutation).mock
      .invocationCallOrder[0];

    expect(clearOrder).toBeLessThan(updateOrder);
    expect(updateOrder).toBeLessThan(advanceOrder);
    expect(advanceOrder).toBeLessThan(activityOrder);
    expect(activityOrder).toBeLessThan(publishOrder);
  });
});
