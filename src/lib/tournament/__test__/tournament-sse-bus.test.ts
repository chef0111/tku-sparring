import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  publishMatchInvalidateEvent,
  publishTournamentSelectionInvalidate,
} from '../tournament-sse-bus';

describe('tournament realtime bus', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true });
    fetchMock.mockClear();
    process.env.REALTIME_INTERNAL_BROADCAST_URL =
      'http://localhost:3331/internal/broadcast';
    process.env.REALTIME_INTERNAL_BROADCAST_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.REALTIME_INTERNAL_BROADCAST_URL;
    delete process.env.REALTIME_INTERNAL_BROADCAST_SECRET;
    vi.restoreAllMocks();
  });

  it('POSTs invalidate payload to internal broadcast URL', async () => {
    publishTournamentSelectionInvalidate('t-1');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3331/internal/broadcast',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-secret',
          'Content-Type': 'application/json',
        }),
      })
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      tournamentId: 't-1',
      event: { type: 'invalidate', tournamentId: 't-1' },
    });
  });

  it('aliases publishMatchInvalidateEvent to selection invalidate', async () => {
    publishMatchInvalidateEvent('t-2');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      tournamentId: 't-2',
      event: { type: 'invalidate', tournamentId: 't-2' },
    });
  });
});
