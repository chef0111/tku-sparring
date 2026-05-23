import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { UserPlus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  PoolBeltFilter,
  PoolGenderSelect,
  PoolSearchInput,
  PoolWeightFilter,
} from '../groups-tab/athlete-pool/filters';
import { getBeltLabel } from '@/config/athlete';
import { bulkAddAthleteResult } from '@/features/dashboard/athlete/lib/bulk-add-athletes';
import { useBulkAddAthletes } from '@/queries/tournament-athletes';
import {
  athleteProfilesQueryOptions,
  useAthleteProfilesInfinite,
} from '@/queries/athlete-profiles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface AddAthletesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  tournamentName: string;
  readOnly: boolean;
}

export function AddAthletesSheet({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  readOnly,
}: AddAthletesSheetProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [autoAssign, setAutoAssign] = React.useState(false);
  const [query, setQuery] = React.useState<string | null>(null);
  const [gender, setGender] = React.useState<'M' | 'F' | null>(null);
  const [beltMin, setBeltMin] = React.useState<number | null>(null);
  const [beltMax, setBeltMax] = React.useState<number | null>(null);
  const [weightMin, setWeightMin] = React.useState<number | null>(null);
  const [weightMax, setWeightMax] = React.useState<number | null>(null);

  const orgQuery = useQuery({
    ...athleteProfilesQueryOptions({
      page: 1,
      perPage: 1,
      filters: [],
      joinOperator: 'and',
      sorting: [],
    }),
    enabled: open,
  });
  const orgTotal = orgQuery.data?.total ?? 0;
  const listQuery = useAthleteProfilesInfinite({
    excludeTournamentId: tournamentId,
    perPage: 30,
    query: query ?? undefined,
    gender: gender ? [gender] : undefined,
    beltLevelMin: beltMin ?? undefined,
    beltLevelMax: beltMax ?? undefined,
    weightMin: weightMin ?? undefined,
    weightMax: weightMax ?? undefined,
    filters: [],
    joinOperator: 'and',
    sorting: [],
  });

  const items = React.useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data]
  );
  const total = listQuery.data?.pages[0]?.total ?? 0;
  const hasFilters =
    !!query ||
    !!gender ||
    beltMin != null ||
    beltMax != null ||
    weightMin != null ||
    weightMax != null;

  const bulkAdd = useBulkAddAthletes({
    onSuccess: (result) => {
      bulkAddAthleteResult(result);
      setSelectedIds(new Set());
      setAutoAssign(false);
      onOpenChange(false);
    },
  });

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!listQuery.hasNextPage || listQuery.isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void listQuery.fetchNextPage();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    listQuery.fetchNextPage,
    items.length,
  ]);

  React.useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setAutoAssign(false);
    }
  }, [open]);

  const pageIds = items.map((item) => item.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleProfile(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (selectedIds.size === 0 || readOnly) return;
    bulkAdd.mutate({
      tournamentId,
      athleteProfileIds: [...selectedIds],
      autoAssign,
    });
  }

  const emptyLibrary =
    !listQuery.isPending && total === 0 && !hasFilters && orgTotal === 0;
  const allInTournament =
    !listQuery.isPending && total === 0 && !hasFilters && orgTotal > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-2 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-lg">Add athletes</SheetTitle>
          <SheetDescription>
            Pick athletes from your library to add to{' '}
            <span className="font-semibold">{tournamentName}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 pt-0">
          <div className="flex flex-col gap-2">
            <PoolSearchInput value={query} onChange={setQuery} />
            <div className="flex gap-2">
              <PoolGenderSelect value={gender} onChange={setGender} />
              <PoolBeltFilter
                poolBeltMin={beltMin}
                poolBeltMax={beltMax}
                onPatch={(patch) => {
                  if ('poolBeltMin' in patch)
                    setBeltMin(patch.poolBeltMin ?? null);
                  if ('poolBeltMax' in patch)
                    setBeltMax(patch.poolBeltMax ?? null);
                }}
              />
              <PoolWeightFilter
                poolWeightMin={weightMin}
                poolWeightMax={weightMax}
                onPatch={(patch) => {
                  if ('poolWeightMin' in patch)
                    setWeightMin(patch.poolWeightMin ?? null);
                  if ('poolWeightMax' in patch)
                    setWeightMax(patch.poolWeightMax ?? null);
                }}
              />
            </div>
          </div>

          {items.length > 0 ? (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="select-all-page"
                checked={allPageSelected}
                onCheckedChange={toggleSelectAllPage}
              />
              <Label
                htmlFor="select-all-page"
                className="cursor-pointer text-xs font-normal"
              >
                Select all shown ({items.length}
                {items.length < total ? ` of ${total}` : ''})
              </Label>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
            {listQuery.isPending ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : emptyLibrary ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 p-8 text-center text-sm">
                <Users className="size-8 opacity-50" aria-hidden="true" />
                <p>No athletes in your library yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  asChild
                >
                  <Link to="/dashboard/athletes">Go to Athletes</Link>
                </Button>
              </div>
            ) : total === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
                <UserPlus className="size-8 opacity-50" aria-hidden="true" />
                <p>
                  {allInTournament
                    ? 'Everyone in your library is already in this tournament.'
                    : hasFilters
                      ? 'No matches for your filters.'
                      : 'No athletes available to add.'}
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y">
                  {items.map((profile) => {
                    const checked = selectedIds.has(profile.id);
                    return (
                      <li key={profile.id}>
                        <label
                          className={cn(
                            'hover:bg-muted/40 flex cursor-pointer items-start gap-3 px-3 py-2 transition-colors',
                            checked && 'bg-muted/30'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleProfile(profile.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {profile.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {profile.affiliation}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px]">
                                {getBeltLabel(profile.beltLevel)}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {profile.weight}kg
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {profile.gender}
                              </Badge>
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <div ref={sentinelRef} className="h-6">
                  {listQuery.isFetchingNextPage ? (
                    <div className="text-muted-foreground p-2 text-center text-xs">
                      Loading…
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        <SheetFooter className="flex-col gap-3 sm:flex-col sm:items-stretch">
          <div className="flex items-start gap-2">
            <Checkbox
              id="add-auto-assign"
              checked={autoAssign}
              onCheckedChange={(v) => setAutoAssign(!!v)}
            />
            <div className="grid gap-1">
              <Label
                htmlFor="add-auto-assign"
                className="cursor-pointer font-normal"
              >
                Auto-assign by group constraints
              </Label>
              {autoAssign ? (
                <p className="text-muted-foreground text-xs">
                  Athletes will be placed in groups matching their gender, belt,
                  and weight. Unmatched athletes go to the unassigned pool.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs tabular-nums">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={bulkAdd.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  readOnly || selectedIds.size === 0 || bulkAdd.isPending
                }
                className="cursor-pointer"
              >
                {bulkAdd.isPending ? (
                  <>
                    <Spinner className="text-primary-foreground" />
                    <span>Adding…</span>
                  </>
                ) : (
                  <>
                    <UserPlus data-icon="inline-start" />
                    Add to tournament
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
