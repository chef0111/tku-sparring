import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import { invalidateAdvanceSelectionQueries } from '@/queries/advance-selection-invalidation';

const realtimeUrl = import.meta.env.VITE_REALTIME_URL as string | undefined;

const DEBOUNCE_MS = 300;

export function useTournamentRealtimeStream(
  tournamentId: string | null,
  enabled = true
) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }
    const base = realtimeUrl?.trim();
    if (!base) {
      return;
    }

    let socket: Socket | null = null;
    let debounceTimer: number | undefined;
    let cancelled = false;

    const runInvalidate = () => {
      if (tournamentId) {
        void invalidateAdvanceSelectionQueries(queryClient, tournamentId);
      } else {
        void queryClient.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'advanceSettings',
        });
      }
    };

    const scheduleInvalidate = () => {
      if (debounceTimer != null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        debounceTimer = undefined;
        runInvalidate();
      }, DEBOUNCE_MS);
    };

    async function connect() {
      const params = new URLSearchParams();
      if (tournamentId) {
        params.set('tournamentId', tournamentId);
      }
      const qs = params.toString();
      const res = await fetch(
        qs
          ? `/api/tournament/socket-token?${qs}`
          : '/api/tournament/socket-token',
        { credentials: 'include' }
      );
      if (!res.ok || cancelled) {
        return;
      }
      const body = (await res.json()) as { token?: string };
      if (!body.token || cancelled) {
        return;
      }
      socket = io(base, {
        auth: { token: body.token },
        transports: ['websocket', 'polling'],
      });
      socket.on('invalidate', scheduleInvalidate);
      socket.on('disconnect', () => {
        scheduleInvalidate();
      });
      socket.on('connect_error', () => {
        scheduleInvalidate();
      });
      socket.on('reconnect', () => {
        scheduleInvalidate();
      });
    }

    void connect();

    return () => {
      cancelled = true;
      if (debounceTimer != null) {
        clearTimeout(debounceTimer);
      }
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }
    };
  }, [queryClient, tournamentId, enabled]);
}
