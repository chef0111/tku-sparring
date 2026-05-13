import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type TournamentsViewMode = 'grid' | 'list';

const STORAGE_KEY = 'tku-tournaments-view';

const VIEW_PARSER = parseAsStringEnum(['grid', 'list']).withDefault('grid');

export function useTournamentsViewMode(): [
  TournamentsViewMode,
  (next: TournamentsViewMode) => void,
] {
  const [view, setView] = useQueryState('view', VIEW_PARSER);
  const migrated = React.useRef(false);

  React.useLayoutEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('view')) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'list' || stored === 'grid') {
        void setView(stored);
      }
    } catch {
      // localStorage may be unavailable
    }
  }, [setView]);

  const setViewPersist = React.useCallback(
    (next: TournamentsViewMode) => {
      void setView(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
    },
    [setView]
  );

  return [view, setViewPersist];
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
