import { beforeEach, describe, expect, it, vi } from 'vitest';

import { advanceWinner, clearWinnerAdvancement } from '../match-progression';
import { applyMatchTransition } from '../match-transition-write';
import { prisma } from '@/lib/db';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { publishSelectionInvalidate } from '@/lib/tournament/tournament-realtime-broadcast';

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

vi.mock('../match-progression', () => ({
  clearWinnerAdvancement: vi.fn(),
  advanceWinner: vi.fn(),
}));

vi.mock('@/orpc/activity/dal', () => ({
  recordTournamentActivity: vi.fn(),
}));

vi.mock('@/lib/tournament/tournament-realtime-broadcast', () => ({
  publishSelectionInvalidate: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('applyMatchTransition', () => {
  it('runs clear, update, advance, and activity inside one transaction', async () => {
    const match = {
      id: 'm1',
      tournamentId: 't-1',
      groupId: 'g-1',
      round: 0,
      matchIndex: 0,
      tournamentWinnerId: 'ta-red',
      kind: 'bracket',
    };

    vi.mocked(tx.match.findUnique).mockResolvedValue(match as never);
    vi.mocked(tx.match.update).mockResolvedValue({
      ...match,
      status: 'complete',
      tournamentWinnerId: 'ta-red',
    } as never);
    vi.mocked(tx.tournamentActivity.create).mockResolvedValue({} as never);

    await applyMatchTransition({
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
    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        tournamentId: 't-1',
        eventType: 'match.score_edit',
      }),
      tx
    );
    expect(publishSelectionInvalidate).toHaveBeenCalledWith('t-1');
    expect(publishSelectionInvalidate).toHaveBeenCalledTimes(1);
  });
});
