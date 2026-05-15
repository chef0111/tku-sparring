import * as React from 'react';

import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { useTournamentSseStream } from '@/hooks/use-tournament-sse-stream';
import { useMatchStore } from '@/stores/match-store';

const HEARTBEAT_MS = 20_000;

export function useArenaMatchClaimSync(args: {
  tournamentId: string | null;
  deviceId: string | undefined;
}) {
  const { tournamentId, deviceId } = args;

  useTournamentSseStream(tournamentId ?? '');

  const { mutateAsync: arenaMutate } = useArenaMutation();
  const arenaMutateRef = React.useRef(arenaMutate);
  arenaMutateRef.current = arenaMutate;

  const matchIdLive = useMatchStore((s) => s.matchId);
  const matchIdRef = React.useRef(matchIdLive);
  matchIdRef.current = matchIdLive;

  React.useEffect(() => {
    if (!tournamentId || !deviceId) {
      return;
    }

    let heartbeatId: number | undefined;

    const clearHeartbeat = () => {
      if (heartbeatId != null) {
        window.clearInterval(heartbeatId);
        heartbeatId = undefined;
      }
    };

    heartbeatId = window.setInterval(() => {
      const mid = matchIdRef.current;
      if (mid && /^[a-f\d]{24}$/i.test(mid)) {
        void arenaMutateRef
          .current({
            kind: 'arenaMatchClaim.heartbeat',
            payload: { matchId: mid, deviceId },
          })
          .catch(() => {});
      }
    }, HEARTBEAT_MS);

    return () => {
      clearHeartbeat();
    };
  }, [deviceId, tournamentId]);
}
