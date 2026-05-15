import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { invalidateAdvanceSelectionQueries } from '@/queries/advance-selection-invalidation';

/**
 * Server route `subscribeToTournamentSseEvents` holds listeners in process memory.
 * `publishTournamentSelectionInvalidate` only reaches clients on the **same** Node
 * isolate. Multi-instance / serverless can miss fan-out; pair with polling where needed.
 */
function buildTournamentStreamUrl(tournamentId: string) {
  const searchParams = new URLSearchParams({ tournamentId });
  return `/api/tournament/stream?${searchParams.toString()}`;
}

export function useTournamentSseStream(tournamentId: string) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (typeof window === 'undefined' || !tournamentId) {
      return;
    }

    const eventSource = new EventSource(buildTournamentStreamUrl(tournamentId));

    const handleInvalidate = () => {
      void invalidateAdvanceSelectionQueries(queryClient, tournamentId);
    };

    eventSource.addEventListener('invalidate', handleInvalidate);

    return () => {
      eventSource.removeEventListener('invalidate', handleInvalidate);
      eventSource.close();
    };
  }, [queryClient, tournamentId]);
}
