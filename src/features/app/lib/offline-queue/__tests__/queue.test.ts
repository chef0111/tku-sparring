import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { replayArenaMutationQueue } from '@/features/app/lib/offline-queue/replay';
import {
  _resetQueueForTests,
  _restoreQueueAfterTests,
  countPending,
  enqueue,
  peekOrdered,
} from '@/features/app/lib/offline-queue/queue';

vi.mock('@/orpc/client', () => ({
  client: {
    match: {
      updateScore: vi.fn().mockResolvedValue(undefined),
      setWinner: vi.fn().mockResolvedValue(undefined),
    },
    device: {
      lastSelection: {
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
    arenaMatchClaim: {
      release: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

beforeEach(() => {
  _resetQueueForTests();
});

afterEach(() => {
  _restoreQueueAfterTests();
  vi.clearAllMocks();
});

describe('arena offline queue', () => {
  it('preserves FIFO order on replay', async () => {
    await enqueue({
      kind: 'match.updateScore',
      payload: { matchId: 'm1', redWins: 1, blueWins: 0 },
    });
    await enqueue({
      kind: 'match.updateScore',
      payload: { matchId: 'm1', redWins: 1, blueWins: 1 },
    });

    const { client } = await import('@/orpc/client');

    await replayArenaMutationQueue();

    expect(client.match.updateScore).toHaveBeenCalledTimes(2);
    expect(client.match.updateScore.mock.calls[0]![0]).toEqual({
      matchId: 'm1',
      redWins: 1,
      blueWins: 0,
    });
    expect(client.match.updateScore.mock.calls[1]![0]).toEqual({
      matchId: 'm1',
      redWins: 1,
      blueWins: 1,
    });
    expect(await countPending()).toBe(0);
  });

  it('stops replay on first failure and preserves remaining rows', async () => {
    const { client } = await import('@/orpc/client');
    vi.mocked(client.match.updateScore)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(undefined);

    await enqueue({
      kind: 'match.updateScore',
      payload: { matchId: 'm1', redWins: 1, blueWins: 0 },
    });
    await enqueue({
      kind: 'match.updateScore',
      payload: { matchId: 'm1', redWins: 2, blueWins: 0 },
    });

    await replayArenaMutationQueue();

    expect(client.match.updateScore).toHaveBeenCalledTimes(1);
    const rows = await peekOrdered();
    expect(rows.length).toBe(2);
    expect(rows[0]!.attempts).toBe(1);
    expect(rows[1]!.attempts).toBe(0);
    expect(await countPending()).toBe(2);
  });
});
