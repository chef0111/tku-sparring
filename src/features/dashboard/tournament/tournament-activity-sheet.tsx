import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ListFilter, ScrollText, X } from 'lucide-react';
import type { TournamentActivityEventType } from '@/orpc/activity/event-types';
import type { ActivityEventFilterOption } from '@/orpc/activity/filter-options';
import { getNormalizedEvents } from '@/orpc/activity/filter-options';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTournamentActivityInfinite } from '@/queries/activity';
import { cn } from '@/lib/utils';

export function TournamentActivitySheet({
  tournamentId,
  open,
  onOpenChange,
}: {
  tournamentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const filterOptions = React.useMemo(() => getNormalizedEvents(), []);

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [selectedTypes, setSelectedTypes] = React.useState<
    Array<TournamentActivityEventType>
  >([]);

  const selectedSet = React.useMemo(
    () => new Set(selectedTypes),
    [selectedTypes]
  );

  const comboboxValue = React.useMemo(
    () => filterOptions.filter((o) => selectedSet.has(o.value)),
    [filterOptions, selectedSet]
  );

  const query = useTournamentActivityInfinite({
    tournamentId,
    eventTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    enabled: open,
  });

  const rows = React.useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data?.pages]
  );

  const onFilterValueChange = React.useCallback(
    (
      next: ActivityEventFilterOption | Array<ActivityEventFilterOption> | null
    ) => {
      const arr = Array.isArray(next) ? next : [];
      setSelectedTypes(arr.map((o) => o.value));
    },
    []
  );

  const onClearFilters = React.useCallback(() => {
    setSelectedTypes([]);
    setFilterOpen(false);
  }, []);

  return (
    <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            <ScrollText className="size-4" />
            Activity
          </SheetTitle>
          <SheetDescription>
            Critical actions for this tournament (who, when, what).
          </SheetDescription>
          <div className="pt-2">
            <Combobox
              isItemEqualToValue={(a, b) => a.value === b.value}
              itemToStringLabel={(o) => o.label}
              itemToStringValue={(o) => o.value}
              items={filterOptions}
              onOpenChange={setFilterOpen}
              onValueChange={onFilterValueChange}
              open={filterOpen}
              value={comboboxValue}
              multiple
              modal={false}
            >
              <ComboboxTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'h-auto min-h-9 w-full justify-between gap-2 py-1.5 font-normal'
                )}
                showChevron={false}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <ListFilter className="text-muted-foreground size-4 shrink-0" />
                  {selectedTypes.length === 0 ? (
                    <span className="text-muted-foreground truncate">
                      All event types
                    </span>
                  ) : (
                    <>
                      <Separator
                        orientation="vertical"
                        className="mx-0.5 my-auto data-[orientation=vertical]:h-4"
                      />
                      <span className="text-muted-foreground hidden truncate sm:inline">
                        {selectedTypes.length} type
                        {selectedTypes.length === 1 ? '' : 's'} selected
                      </span>
                      <div className="hidden max-w-50 flex-wrap gap-1 sm:flex">
                        {comboboxValue.slice(0, 2).map((o) => (
                          <span
                            key={o.value}
                            className="bg-secondary text-secondary-foreground max-w-full truncate rounded px-1.5 py-0.5 text-xs"
                          >
                            {o.label}
                          </span>
                        ))}
                        {comboboxValue.length > 2 ? (
                          <span className="text-muted-foreground text-xs">
                            +{comboboxValue.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </ComboboxTrigger>
              <ComboboxContent align="start" className="w-(--anchor-width)">
                <ComboboxInput
                  showTrigger={false}
                  placeholder="Search types…"
                />
                <ComboboxEmpty>No matching event types.</ComboboxEmpty>
                <ComboboxList className="max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto">
                  {(option: ActivityEventFilterOption) => {
                    const isSelected = selectedSet.has(option.value);
                    return (
                      <ComboboxItem
                        key={option.value}
                        className="[&>span.pointer-events-none.absolute]:hidden"
                        value={option}
                      >
                        <Checkbox checked={isSelected} />
                        <span className="min-w-0 flex-1 truncate text-left">
                          {option.label}
                        </span>
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
                {selectedTypes.length > 0 ? (
                  <>
                    <ComboboxSeparator />
                    <button
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'mx-1 mb-1 flex w-full items-center justify-between gap-2 font-normal'
                      )}
                      type="button"
                      onClick={onClearFilters}
                    >
                      <span>Clear filters</span>
                      <X className="size-4 shrink-0" />
                    </button>
                  </>
                ) : null}
              </ComboboxContent>
            </Combobox>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {query.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : query.isError ? (
            <p className="text-destructive text-sm">
              {query.error?.message ?? 'Failed to load activity.'}
            </p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {rows.map((row) => {
                const createdAt =
                  row.createdAt instanceof Date
                    ? row.createdAt
                    : new Date(row.createdAt);
                return (
                  <li
                    key={row.id}
                    className="border-border rounded-md border px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug">{row.summary}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <time
                            className="text-muted-foreground shrink-0 text-xs whitespace-nowrap"
                            dateTime={createdAt.toISOString()}
                          >
                            {formatDistanceToNow(createdAt, {
                              addSuffix: true,
                            })}
                          </time>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          {createdAt.toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {row.adminName}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {query.hasNextPage ? (
          <div className="border-t p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
