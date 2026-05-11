export interface LeaseStreamInvalidateEvent {
  type: 'invalidate';
  tournamentId: string;
}

type LeaseStreamEvent = LeaseStreamInvalidateEvent;
type LeaseStreamListener = (event: LeaseStreamEvent) => void;

const leaseStreamListeners = new Map<string, Set<LeaseStreamListener>>();

export function subscribeToLeaseEvents(
  tournamentId: string,
  listener: LeaseStreamListener
) {
  const listeners = leaseStreamListeners.get(tournamentId) ?? new Set();
  listeners.add(listener);
  leaseStreamListeners.set(tournamentId, listeners);

  return () => {
    const currentListeners = leaseStreamListeners.get(tournamentId);

    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);

    if (currentListeners.size === 0) {
      leaseStreamListeners.delete(tournamentId);
    }
  };
}

export function publishLeaseEvent(event: LeaseStreamEvent) {
  const listeners = leaseStreamListeners.get(event.tournamentId);

  if (!listeners) {
    return;
  }

  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch {
      listeners.delete(listener);
    }
  }

  if (listeners.size === 0) {
    leaseStreamListeners.delete(event.tournamentId);
  }
}
