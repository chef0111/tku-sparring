import { describe, expect, it, vi } from 'vitest';

import {
  publishMatchInvalidateEvent,
  publishTournamentSelectionInvalidate,
  subscribeToTournamentSseEvents,
} from './tournament-sse-bus';

describe('tournament sse bus', () => {
  it('isolates throwing listeners so publish does not fail', () => {
    const brokenListener = vi.fn(() => {
      throw new Error('stream closed');
    });
    const healthyListener = vi.fn();
    const unsubscribeBroken = subscribeToTournamentSseEvents(
      'tournament-1',
      brokenListener
    );
    const unsubscribeHealthy = subscribeToTournamentSseEvents(
      'tournament-1',
      healthyListener
    );

    expect(() =>
      publishTournamentSelectionInvalidate('tournament-1')
    ).not.toThrow();
    expect(healthyListener).toHaveBeenCalledTimes(1);

    publishTournamentSelectionInvalidate('tournament-1');

    expect(brokenListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(2);

    unsubscribeBroken();
    unsubscribeHealthy();
  });

  it('aliases publishMatchInvalidateEvent to selection invalidate', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTournamentSseEvents('t-1', listener);

    publishMatchInvalidateEvent('t-1');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      type: 'invalidate',
      tournamentId: 't-1',
    });

    unsubscribe();
  });
});
