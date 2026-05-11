import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LeaseSnapshot } from '@/queries/leases';
import {
  invalidateLeaseQueries,
  setLeaseSnapshotInCache,
} from '@/queries/leases';

function buildLeaseStreamUrl(tournamentId: string) {
  const searchParams = new URLSearchParams({ tournamentId });
  return `/api/lease/stream?${searchParams.toString()}`;
}

export function useLeaseStream(tournamentId: string) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (typeof window === 'undefined' || !tournamentId) {
      return;
    }

    const eventSource = new EventSource(buildLeaseStreamUrl(tournamentId));

    const handleSnapshot = (event: Event) => {
      try {
        const message = event as MessageEvent<string>;
        const snapshot = JSON.parse(message.data) as LeaseSnapshot;
        setLeaseSnapshotInCache(queryClient, tournamentId, snapshot);
      } catch {
        void invalidateLeaseQueries(queryClient, tournamentId);
      }
    };

    const handleInvalidate = () => {
      void invalidateLeaseQueries(queryClient, tournamentId);
    };

    eventSource.addEventListener('snapshot', handleSnapshot);
    eventSource.addEventListener('invalidate', handleInvalidate);

    return () => {
      eventSource.removeEventListener('snapshot', handleSnapshot);
      eventSource.removeEventListener('invalidate', handleInvalidate);
      eventSource.close();
    };
  }, [queryClient, tournamentId]);
}
