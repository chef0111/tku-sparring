import * as React from 'react';

import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { useTournamentRealtimeStream } from '@/hooks/use-tournament-realtime-stream';

const HEARTBEAT_MS = 20_000;

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function useMatchSync(args: {
  tournamentId: string | null;
  deviceId: string | undefined;
  claimMatchId: string | null;
  realtimeEnabled?: boolean;
}) {
  const { tournamentId, deviceId, claimMatchId, realtimeEnabled = true } = args;

  useTournamentRealtimeStream(tournamentId, realtimeEnabled);

  const { mutateAsync: arenaMutate } = useArenaMutation();
  const arenaMutateRef = React.useRef(arenaMutate);
  arenaMutateRef.current = arenaMutate;

  const claimMatchIdRef = React.useRef(claimMatchId);
  claimMatchIdRef.current = claimMatchId;

  React.useEffect(() => {
    if (!tournamentId || !deviceId) {
      return;
    }

    const sendHeartbeat = () => {
      const mid = claimMatchIdRef.current;
      if (mid && OBJECT_ID_RE.test(mid)) {
        void arenaMutateRef
          .current({
            kind: 'arenaMatchClaim.heartbeat',
            payload: { matchId: mid, deviceId },
          })
          .catch(() => {});
      }
    };

    sendHeartbeat();

    const heartbeatId = window.setInterval(sendHeartbeat, HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatId);
    };
  }, [deviceId, tournamentId, claimMatchId]);
}
