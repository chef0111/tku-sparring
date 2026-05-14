import { describe, expect, it, vi } from 'vitest';

import {
  publishLeaseEvent,
  publishMatchInvalidateEvent,
  subscribeToLeaseEvents,
} from './lease-stream';

describe('lease stream publisher', () => {
  it('isolates throwing listeners so publish does not fail', () => {
    const brokenListener = vi.fn(() => {
      throw new Error('stream closed');
    });
    const healthyListener = vi.fn();
    const unsubscribeBroken = subscribeToLeaseEvents(
      'tournament-1',
      brokenListener
    );
    const unsubscribeHealthy = subscribeToLeaseEvents(
      'tournament-1',
      healthyListener
    );

    expect(() =>
      publishLeaseEvent({
        type: 'invalidate',
        tournamentId: 'tournament-1',
      })
    ).not.toThrow();
    expect(healthyListener).toHaveBeenCalledTimes(1);

    publishLeaseEvent({
      type: 'invalidate',
      tournamentId: 'tournament-1',
    });

    expect(brokenListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(2);

    unsubscribeBroken();
    unsubscribeHealthy();
  });

  it('notifies subscribers on match.invalidate publish', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToLeaseEvents('t-1', listener);

    publishMatchInvalidateEvent('t-1');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      type: 'match.invalidate',
      tournamentId: 't-1',
    });

    unsubscribe();
  });
});
