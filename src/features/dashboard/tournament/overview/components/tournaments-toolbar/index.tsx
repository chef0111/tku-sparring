import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs';

import { ViewModeToggle, useTournamentsViewMode } from './view-mode-toggle';
import type { TournamentStatus } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

const QUERY_DEBOUNCE_MS = 300;

const STATUS_VALUES: ReadonlyArray<TournamentStatus> = [
  'draft',
  'active',
  'completed',
];

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

const ALL_STATUS_VALUE = '__all__';

interface TournamentsToolbarProps {
  onCreate: () => void;
  className?: string;
}

export function TournamentsToolbar({
  onCreate,
  className,
}: TournamentsToolbarProps) {
  const [viewMode, setViewMode] = useTournamentsViewMode();

  const [query, setQuery] = useQueryState(
    'query',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsArrayOf(parseAsStringEnum([...STATUS_VALUES]), ',')
      .withDefault([])
      .withOptions({ clearOnDefault: true })
  );

  const [localQuery, setLocalQuery] = React.useState(query);
  const querySyncRef = React.useRef(0);
  React.useEffect(() => {
    setLocalQuery(query);
    querySyncRef.current += 1;
  }, [query]);

  const debouncedSetQuery = useDebouncedCallback(
    (next: string, generationAtSchedule: number) => {
      if (generationAtSchedule !== querySyncRef.current) return;
      void setQuery(next);
    },
    QUERY_DEBOUNCE_MS
  );

  const onQueryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setLocalQuery(next);
      debouncedSetQuery(next, querySyncRef.current);
    },
    [debouncedSetQuery]
  );

  const statusSelectValue =
    statusFilter.length === 1 ? statusFilter[0] : ALL_STATUS_VALUE;

  const onStatusChange = React.useCallback(
    (next: string) => {
      if (next === ALL_STATUS_VALUE) {
        void setStatusFilter([]);
        return;
      }
      if (STATUS_VALUES.includes(next as TournamentStatus)) {
        void setStatusFilter([next as TournamentStatus]);
      }
    },
    [setStatusFilter]
  );

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn('flex w-full flex-wrap items-center gap-2 py-2', className)}
    >
      <InputGroup className="h-9 min-w-48 flex-1">
        <InputGroupAddon className="bg-background h-full rounded-l-md border-r pr-2">
          <Search className="text-primary" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search tournaments..."
          value={localQuery}
          onChange={onQueryChange}
          aria-label="Search tournaments"
          className="h-full"
        />
      </InputGroup>

      <Select value={statusSelectValue} onValueChange={onStatusChange}>
        <SelectTrigger className="h-9 w-36" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS_VALUE}>All statuses</SelectItem>
          {STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ViewModeToggle value={viewMode} onChange={setViewMode} />

      <Button size="sm" onClick={onCreate}>
        <Plus className="mr-1 size-4" />
        New tournament
      </Button>
    </div>
  );
}
