import * as React from 'react';

import { replayArenaMutationQueue } from '@/features/app/lib/offline-queue/replay';
import { useOnlineStatus } from '@/features/app/hooks/use-online-status';

export function useReplayOnOnline() {
  const online = useOnlineStatus();

  React.useEffect(() => {
    if (!online) {
      return;
    }

    void replayArenaMutationQueue();

    const onOnline = () => {
      void replayArenaMutationQueue();
    };

    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [online]);
}
