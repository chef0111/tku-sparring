export interface TournamentSseInvalidateEvent {
  type: 'invalidate';
  tournamentId: string;
}

export type TournamentSseEvent = TournamentSseInvalidateEvent;

let loggedMissingRealtime = false;

function getBroadcastConfig() {
  const url = process.env.REALTIME_INTERNAL_BROADCAST_URL?.trim();
  const secret = process.env.REALTIME_INTERNAL_BROADCAST_SECRET?.trim();
  return url && secret ? { url, secret } : null;
}

async function postInternalBroadcast(
  tournamentId: string,
  event: TournamentSseEvent
) {
  const cfg = getBroadcastConfig();
  if (!cfg) {
    if (!loggedMissingRealtime && process.env.NODE_ENV !== 'test') {
      loggedMissingRealtime = true;
      console.warn(
        '[tournament-realtime] REALTIME_INTERNAL_BROADCAST_URL / REALTIME_INTERNAL_BROADCAST_SECRET unset — cross-instance invalidation disabled.'
      );
    }
    return;
  }
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.secret}`,
      },
      body: JSON.stringify({ tournamentId, event }),
      signal: ac.signal,
    });
    clearTimeout(t);
  } catch {
    // fire-and-forget
  }
}

/** Notifies all browsers in `tournament:{id}` via the external realtime service. */
export function publishTournamentSelectionInvalidate(tournamentId: string) {
  const event: TournamentSseEvent = { type: 'invalidate', tournamentId };
  void postInternalBroadcast(tournamentId, event);
}

export function publishMatchInvalidateEvent(tournamentId: string) {
  publishTournamentSelectionInvalidate(tournamentId);
}
