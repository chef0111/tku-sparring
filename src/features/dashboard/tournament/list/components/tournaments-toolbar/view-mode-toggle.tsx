import * as React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { useRouterState } from '@tanstack/react-router';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type TournamentsViewMode = 'grid' | 'list';

const STORAGE_KEY = 'tku-tournaments-view';

const VIEW_PARSER = parseAsStringEnum(['grid', 'list']).withDefault('grid');

function normalizePathname(pathname: string) {
  return pathname.replace(/\/$/, '') || '/';
}

function isTournamentsListIndexPathname(pathname: string) {
  return normalizePathname(pathname) === '/dashboard/tournaments';
}

/** While navigating away from the list, `location` is already the destination but this route can still render briefly. */
function viewFromCommittedSearchDuringListExit(state: {
  location: { pathname: string; search: unknown };
  resolvedLocation?: { pathname: string; search: unknown };
}): TournamentsViewMode | null {
  const resolved = state.resolvedLocation ?? state.location;
  if (
    !isTournamentsListIndexPathname(resolved.pathname) ||
    isTournamentsListIndexPathname(state.location.pathname)
  ) {
    return null;
  }
  const search = resolved.search;
  if (!search || typeof search !== 'object') return null;
  const raw = (search as Record<string, unknown>).view;
  return raw === 'list' || raw === 'grid' ? raw : null;
}

export function useTournamentsViewMode(): [
  TournamentsViewMode,
  (next: TournamentsViewMode) => void,
] {
  const [view, setView] = useQueryState('view', VIEW_PARSER);
  const viewWhileLeavingList = useRouterState({
    select: viewFromCommittedSearchDuringListExit,
  });
  const effectiveView = viewWhileLeavingList ?? view;
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

  return [effectiveView, setViewPersist];
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
