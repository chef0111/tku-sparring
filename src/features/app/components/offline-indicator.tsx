import * as React from 'react';

import { useOnlineStatus } from '@/features/app/hooks/use-online-status';
import {
  countPending,
  subscribeQueue,
} from '@/features/app/lib/offline-queue/queue';
import { Badge } from '@/components/ui/badge';

export function OfflineIndicator() {
  const online = useOnlineStatus();
  const [pending, setPending] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      void countPending().then((n) => {
        if (!cancelled) {
          setPending(n);
        }
      });
    };

    refresh();
    const unsub = subscribeQueue(refresh);

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (online && pending === 0) {
    return null;
  }

  const label = online
    ? `Online · ${pending} pending`
    : `Offline · ${pending} pending`;

  return (
    <Badge variant={online ? 'secondary' : 'destructive'} className="text-xs">
      {label}
    </Badge>
  );
}
