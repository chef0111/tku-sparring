import * as React from 'react';
import type { DataTableFeatureFlag } from '@/config/feature-flags';

const STORAGE_KEY = 'tku:feature-flags';

function readFlags(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useFeatureFlags() {
  const [flags, setFlags] = React.useState<Record<string, boolean>>(readFlags);

  React.useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setFlags(readFlags());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isEnabled = React.useCallback(
    (flag: DataTableFeatureFlag) => flags[flag] === true,
    [flags]
  );

  const toggleFlag = React.useCallback((flag: DataTableFeatureFlag) => {
    setFlags((prev) => {
      const next = { ...prev, [flag]: !prev[flag] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { flags, isEnabled, toggleFlag };
}
