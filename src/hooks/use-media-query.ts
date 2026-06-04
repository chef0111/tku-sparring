import { useSyncExternalStore } from 'react';

const DESKTOP_FIRST_SNAPSHOT = true;

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => DESKTOP_FIRST_SNAPSHOT
  );
}
