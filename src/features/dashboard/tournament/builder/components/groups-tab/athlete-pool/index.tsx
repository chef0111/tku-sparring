import * as React from 'react';
import { UserPlus } from 'lucide-react';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';
import { useBuilderManagerQuery } from '../../../hooks/use-builder-manager-query';
import {
  PoolBeltFilter,
  PoolGenderSelect,
  PoolSearchInput,
  PoolWeightFilter,
} from './filters';
import { AthletePoolRow } from './athlete-pool-row';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTournamentAthletesInfinite } from '@/queries/tournament-athletes';

interface AthletePoolProps {
  tournamentId: string;
  selectedGroupId: string | null;
  readOnly: boolean;
}

const POOL_FILTER_PARSERS = {
  q: parseAsString,
  poolGender: parseAsStringEnum(['M', 'F']),
  poolBeltMin: parseAsInteger,
  poolBeltMax: parseAsInteger,
  poolWeightMin: parseAsInteger,
  poolWeightMax: parseAsInteger,
};

export function AthletePool({
  tournamentId,
  selectedGroupId,
  readOnly,
}: AthletePoolProps) {
  const {
    poolQuery,
    poolGender,
    poolBeltMin,
    poolBeltMax,
    poolWeightMin,
    poolWeightMax,
  } = useBuilderManagerQuery();
  const [, setFilters] = useQueryStates(POOL_FILTER_PARSERS);

  const query = useTournamentAthletesInfinite({
    tournamentId,
    unassignedOnly: true,
    perPage: 30,
    query: poolQuery ?? undefined,
    gender: poolGender ? [poolGender] : undefined,
    beltLevelMin: poolBeltMin ?? undefined,
    beltLevelMax: poolBeltMax ?? undefined,
    weightMin: poolWeightMin ?? undefined,
    weightMax: poolWeightMax ?? undefined,
    sorting: [],
  });

  const items = React.useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;
  const hasFilters =
    !!poolQuery ||
    !!poolGender ||
    poolBeltMin != null ||
    poolBeltMax != null ||
    poolWeightMin != null ||
    poolWeightMax != null;

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    query.hasNextPage,
    query.isFetchingNextPage,
    query.fetchNextPage,
    items.length,
  ]);

  return (
    <div className="bg-card flex w-72 shrink-0 flex-col overflow-hidden border-r">
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Unassigned Athletes</h3>
          <Badge variant="secondary">{total}</Badge>
        </div>

        <div className="flex flex-col gap-2">
          <PoolSearchInput
            value={poolQuery}
            onChange={(q) => void setFilters({ q })}
          />

          <div className="flex gap-2">
            <PoolGenderSelect
              value={poolGender}
              onChange={(next) => void setFilters({ poolGender: next })}
            />
            <PoolBeltFilter
              poolBeltMin={poolBeltMin}
              poolBeltMax={poolBeltMax}
              onPatch={(patch) => void setFilters(patch)}
            />
            <PoolWeightFilter
              poolWeightMin={poolWeightMin}
              poolWeightMax={poolWeightMax}
              onPatch={(patch) => void setFilters(patch)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-6 text-center text-sm">
            <UserPlus className="size-8 opacity-50" />
            {hasFilters ? 'No matches' : 'No unassigned athletes'}
          </div>
        ) : (
          <>
            <div className="divide-y">
              {items.map((athlete) => (
                <AthletePoolRow
                  key={athlete.id}
                  athlete={athlete}
                  selectedGroupId={selectedGroupId}
                  readOnly={readOnly}
                />
              ))}
            </div>
            <div ref={sentinelRef} className="h-6">
              {query.isFetchingNextPage && (
                <div className="text-muted-foreground p-2 text-center text-xs">
                  Loading...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
