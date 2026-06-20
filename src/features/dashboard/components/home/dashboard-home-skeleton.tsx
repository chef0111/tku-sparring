import { Layers, LayoutGrid, Trophy, Users } from 'lucide-react';
import { HubMetricCard } from './hub-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { cn } from '@/lib/utils';

const kpiTiles = [
  { key: 'tournaments', label: 'Tournaments', icon: Trophy, withAction: true },
  { key: 'athletes', label: 'Athletes', icon: Users },
  { key: 'divisions', label: 'Divisions', icon: Layers },
  { key: 'matches', label: 'Matches', icon: LayoutGrid },
] as const;

function KpiStripSkeleton() {
  return (
    <section className="flex flex-col gap-3">
      <div className="grid items-stretch gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-4">
        {kpiTiles.map((tile) => (
          <HubMetricCard
            key={tile.key}
            label={tile.label}
            icon={tile.icon}
            value={<Skeleton className="h-9 w-16" />}
            footer={<Skeleton className="h-4 w-36" />}
            action={
              'withAction' in tile &&
              tile.withAction && <Skeleton className="size-7 rounded-md" />
            }
          />
        ))}
      </div>
    </section>
  );
}

function PipelineSkeleton() {
  return (
    <div className="border-border/80 bg-muted/20 overflow-hidden rounded-md border">
      <div className="border-border/60 border-b px-3 py-1.5">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="divide-border/60 flex snap-x items-stretch divide-x overflow-x-auto xl:grid xl:grid-cols-3 xl:divide-x-0">
        {Array.from({ length: 3 }, (_col, columnIndex) => (
          <div
            key={columnIndex}
            className="flex h-full min-h-72 min-w-[78vw] shrink-0 flex-col sm:min-w-[52vw] xl:min-w-0"
          >
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col',
                columnIndex > 0 && 'border-border/60 border-l'
              )}
            >
              <div className="border-border/60 flex items-center justify-between border-b px-3 py-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="divide-border/60 min-h-0 flex-1 divide-y">
                {Array.from({ length: 3 }, (_row, rowIndex) => (
                  <Skeleton
                    key={rowIndex}
                    className="mx-3 my-2 h-14 rounded-none"
                  />
                ))}
              </div>
            </div>
            <div className="border-border/60 shrink-0 border-x border-t px-2 py-1.5">
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <KpiStripSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="min-h-70 rounded-xl" />
        ))}
      </div>
      <PipelineSkeleton />
      <DataTableSkeleton columnCount={6} withViewOptions={false} rowCount={5} />
    </div>
  );
}
