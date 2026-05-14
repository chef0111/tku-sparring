import * as React from 'react';

import type { ArenaMutation } from '@/features/app/lib/offline-queue/types';
import { enqueue } from '@/features/app/lib/offline-queue/queue';
import { replayArenaMutationQueue } from '@/features/app/lib/offline-queue/replay';
import { client } from '@/orpc/client';
import { useOnlineStatus } from '@/features/app/hooks/use-online-status';

async function runMutationDirect(mutation: ArenaMutation) {
  switch (mutation.kind) {
    case 'match.updateScore':
      await client.match.updateScore(mutation.payload);
      return;
    case 'match.setWinner':
      await client.match.setWinner(mutation.payload);
      return;
    case 'lease.heartbeat':
      await client.lease.heartbeat(mutation.payload);
      return;
    case 'lease.release':
      await client.lease.release(mutation.payload);
      return;
    case 'device.lastSelection.set':
      await client.device.lastSelection.set(mutation.payload);
      return;
    default:
      throw new Error('Unknown mutation kind');
  }
}

export function useArenaMutation() {
  const online = useOnlineStatus();

  const mutateAsync = React.useCallback(
    async (mutation: ArenaMutation) => {
      if (online) {
        await runMutationDirect(mutation);
        await replayArenaMutationQueue();
        return;
      }

      await enqueue(mutation);
    },
    [online]
  );

  return { mutateAsync };
}
