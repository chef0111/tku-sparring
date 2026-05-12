import * as React from 'react';
import { Search, SlidersHorizontal, UserPlus } from 'lucide-react';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs';
import { useBuilderManagerQuery } from '../../../hooks/use-builder-manager-query';
import { AthletePoolRow } from './athlete-pool-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search name or affiliation..."
              value={poolQuery ?? ''}
              onChange={(e) => void setFilters({ q: e.target.value || null })}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={poolGender ?? 'all'}
              onValueChange={(v) =>
                void setFilters({
                  poolGender: v === 'all' ? null : (v as 'M' | 'F'),
                })
              }
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                >
                  Belt
                  {(poolBeltMin != null || poolBeltMax != null) && (
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1 text-[10px]"
                    >
                      {poolBeltMin ?? 0}-{poolBeltMax ?? 10}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium">Belt range</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      placeholder="Min"
                      value={poolBeltMin ?? ''}
                      onChange={(e) =>
                        void setFilters({
                          poolBeltMin:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                    <span className="text-muted-foreground text-xs">–</span>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      placeholder="Max"
                      value={poolBeltMax ?? ''}
                      onChange={(e) =>
                        void setFilters({
                          poolBeltMax:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                >
                  <SlidersHorizontal className="size-3" />
                  kg
                  {(poolWeightMin != null || poolWeightMax != null) && (
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1 text-[10px]"
                    >
                      {poolWeightMin ?? 0}-{poolWeightMax ?? 300}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium">Weight range (kg)</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      placeholder="Min"
                      value={poolWeightMin ?? ''}
                      onChange={(e) =>
                        void setFilters({
                          poolWeightMin:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                    <span className="text-muted-foreground text-xs">–</span>
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      placeholder="Max"
                      value={poolWeightMax ?? ''}
                      onChange={(e) =>
                        void setFilters({
                          poolWeightMax:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
