import { Layers, LayoutGrid, ListChecks, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HubMetricCard,
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/home/components/hub-panel';
import { Skeleton } from '@/components/ui/skeleton';

const kpiTiles = [
  { key: 'groups', label: 'Groups', icon: Layers },
  { key: 'athletes', label: 'Athletes', icon: Users },
  { key: 'matches', label: 'Matches', icon: LayoutGrid },
] as const;

export function TournamentCommandCenterHeaderActionSkeleton() {
  return <Skeleton className="h-6 w-48 max-w-[40vw]" />;
}

export function HeaderControlsSkeleton() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-36" />
    </div>
  );
}

export function TournamentKpiRowSkeleton() {
  return (
    <section className="flex flex-col gap-3 px-6">
      <div className="grid items-stretch gap-4 overflow-visible sm:grid-cols-2 xl:grid-cols-3">
        {kpiTiles.map((tile) => (
          <HubMetricCard
            key={tile.key}
            label={tile.label}
            icon={tile.icon}
            value={<Skeleton className="h-9 w-16" />}
            footer={<Skeleton className="h-4 w-36" />}
          />
        ))}
      </div>
    </section>
  );
}

export function SetupChecklistSkeleton() {
  return (
    <HubSection
      title="Pre-activation setup"
      description="Start with the athlete pool, then build out divisions and brackets."
      action={<Skeleton className="h-5 w-10 rounded-full" />}
    >
      <HubSectionContent className="flex flex-col gap-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <ListChecks className="size-3.5" aria-hidden="true" />
              Setup progress
            </span>
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <li className="relative flex gap-3">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => {
              const isLast = i === 2;
              return (
                <li className={cn('relative flex gap-3', !isLast && 'pb-3')}>
                  <div className="relative flex w-5 shrink-0 translate-y-[25px] flex-col items-center">
                    <Skeleton className="size-5 rounded-full border" />
                    {!isLast && (
                      <div
                        aria-hidden
                        className="bg-border absolute top-5 -bottom-3 left-1/2 w-px -translate-x-1/2"
                      />
                    )}
                  </div>
                  <Skeleton key={i} className="h-20 w-full rounded-lg border" />
                </li>
              );
            })}
          </div>
        </li>
      </HubSectionContent>
    </HubSection>
  );
}

export function GroupsOverviewSkeleton() {
  return (
    <HubSection
      title="Groups"
      description="Divisions and arena assignments for this tournament"
      className="mt-6 ml-6 bg-transparent p-0"
    >
      <HubSectionContent className="grid items-stretch gap-4 p-0 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <HubMetricCard
            key={i}
            label={<Skeleton className="h-4 w-28" />}
            icon={Layers}
            value={<Skeleton className="h-9 w-12" />}
            footer={<Skeleton className="h-4 w-32" />}
            action={<Skeleton className="h-4 w-14" />}
          />
        ))}
      </HubSectionContent>
    </HubSection>
  );
}

export function ActivityPanelSkeleton() {
  return (
    <HubSection
      title="Recent activity"
      description="Latest tournament events"
      className="bg-popover ring-border/10 mt-6 mr-6 rounded-xl p-4 ring-1"
      action={<Skeleton className="h-8 w-24 rounded-md" />}
    >
      <HubSectionContent padded={false}>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </HubSectionContent>
    </HubSection>
  );
}
