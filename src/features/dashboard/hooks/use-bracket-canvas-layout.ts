import * as React from 'react';

import type { BracketCanvasLayout } from '@/lib/tournament/bracket/bracket-layout';

const STORAGE_KEY = 'tku-bracket-canvas-layout';

function readStoredLayout(): BracketCanvasLayout | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'one-sided' || stored === 'two-sided') return stored;
  } catch {
    // localStorage may be unavailable
  }
  return null;
}

export function useBracketCanvasLayout(): [
  BracketCanvasLayout,
  (next: BracketCanvasLayout) => void,
] {
  const [layoutMode, setLayoutMode] =
    React.useState<BracketCanvasLayout>('two-sided');
  const hydrated = React.useRef(false);

  React.useLayoutEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readStoredLayout();
    if (stored) setLayoutMode(stored);
  }, []);

  const setLayoutPersist = React.useCallback((next: BracketCanvasLayout) => {
    setLayoutMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return [layoutMode, setLayoutPersist];
}
