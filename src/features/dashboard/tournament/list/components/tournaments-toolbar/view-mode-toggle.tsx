import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type TournamentsViewMode = 'grid' | 'list';

const STORAGE_KEY = 'tku-tournaments-view';
const DEFAULT_MODE: TournamentsViewMode = 'grid';

const listeners = new Set<() => void>();
let currentMode: TournamentsViewMode = DEFAULT_MODE;
let hasHydrated = false;

function readFromStorage(): TournamentsViewMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'list' || value === 'grid' ? value : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function hydrateOnce() {
  if (hasHydrated || typeof window === 'undefined') return;
  hasHydrated = true;
  currentMode = readFromStorage();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): TournamentsViewMode {
  hydrateOnce();
  return currentMode;
}

function getServerSnapshot(): TournamentsViewMode {
  return DEFAULT_MODE;
}

function setViewMode(next: TournamentsViewMode) {
  if (next === currentMode) return;
  currentMode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
  for (const listener of listeners) listener();
}

export function useTournamentsViewMode(): [
  TournamentsViewMode,
  (next: TournamentsViewMode) => void,
] {
  const mode = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  return [mode, setViewMode];
}

interface ViewModeToggleProps {
  value: TournamentsViewMode;
  onChange: (next: TournamentsViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next === 'grid' || next === 'list') onChange(next);
      }}
      aria-label="View mode"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
