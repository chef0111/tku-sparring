export interface TournamentSseInvalidateEvent {
  type: 'invalidate';
  tournamentId: string;
}

export type TournamentSseEvent = TournamentSseInvalidateEvent;

type TournamentSseListener = (event: TournamentSseEvent) => void;

const tournamentSseListeners = new Map<string, Set<TournamentSseListener>>();

export function subscribeToTournamentSseEvents(
  tournamentId: string,
  listener: TournamentSseListener
) {
  const listeners = tournamentSseListeners.get(tournamentId) ?? new Set();
  listeners.add(listener);
  tournamentSseListeners.set(tournamentId, listeners);

  return () => {
    const currentListeners = tournamentSseListeners.get(tournamentId);

    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);

    if (currentListeners.size === 0) {
      tournamentSseListeners.delete(tournamentId);
    }
  };
}

export function publishTournamentSelectionInvalidate(tournamentId: string) {
  const listeners = tournamentSseListeners.get(tournamentId);

  if (!listeners) {
    return;
  }

  const event: TournamentSseEvent = { type: 'invalidate', tournamentId };

  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch {
      listeners.delete(listener);
    }
  }

  if (listeners.size === 0) {
    tournamentSseListeners.delete(tournamentId);
  }
}

export function publishMatchInvalidateEvent(tournamentId: string) {
  publishTournamentSelectionInvalidate(tournamentId);
}
