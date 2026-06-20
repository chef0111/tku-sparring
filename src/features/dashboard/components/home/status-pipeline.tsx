import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import {
  Archive,
  ArrowRight,
  ArrowUpRight,
  BlocksIcon,
  Layers,
  LayoutGrid,
  Pencil,
  Radio,
  Users,
} from 'lucide-react';
import { HubSection } from './hub-panel';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardStats } from '@/features/dashboard/lib/home/compute-dashboard-stats';
import type {
  TournamentListItem,
  TournamentStatus,
} from '@/contracts/tournament/list';
import type { StatusProps } from '@/components/ui/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { cn } from '@/lib/utils';

interface StatusPipelineProps {
  pipeline: DashboardStats['pipeline'];
  statusCounts: DashboardStats['kpis']['byStatus'];
}

const columns: Array<{
  status: TournamentStatus;
  label: string;
  subtitle: string;
  viewAllLabel: string;
  icon: LucideIcon;
}> = [
  {
    status: 'draft',
    label: 'Draft',
    subtitle: 'Setup in progress',
    viewAllLabel: 'View draft',
    icon: Pencil,
  },
  {
    status: 'active',
    label: 'Active',
    subtitle: 'Live operations',
    viewAllLabel: 'View active',
    icon: Radio,
  },
  {
    status: 'completed',
    label: 'Completed',
    subtitle: 'Archived and read-only',
    viewAllLabel: 'View completed',
    icon: Archive,
  },
];

const pipelineStatusVariant: Record<TournamentStatus, StatusProps['status']> = {
  draft: 'degraded',
  active: 'online',
  completed: 'maintenance',
};

const stageAccent: Record<TournamentStatus, string> = {
  draft: 'border-l-amber-500',
  active: 'border-l-emerald-500',
  completed: 'border-l-blue-500',
};

const rowHoverAccent: Record<TournamentStatus, string> = {
  draft: 'hover:border-l-amber-500',
  active: 'hover:border-l-emerald-500',
  completed: 'hover:border-l-blue-500',
};

function PipelineFrame({ children }: { children: ReactNode }) {
  return (
    <div className="border-border/80 bg-muted/20 overflow-hidden rounded-md border">
      <div className="border-border/60 bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
        <BlocksIcon className="size-3.5" />
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          Lifecycle stages
        </span>
      </div>
      {children}
    </div>
  );
}

function PipelineStageHeader({
  status,
  label,
  subtitle,
  count,
}: {
  status: TournamentStatus;
  label: string;
  subtitle: string;
  count: number;
}) {
  return (
    <header className="border-border/60 flex items-center justify-between gap-2 border-b px-3 py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Status
          status={pipelineStatusVariant[status]}
          className="gap-1.5 bg-transparent p-0"
        >
          <StatusIndicator />
          <StatusLabel className="text-foreground text-xs font-medium">
            {label}
          </StatusLabel>
        </Status>
        <span className="text-muted-foreground truncate font-mono text-[10px]">
          {subtitle}
        </span>
      </div>
      <Badge variant="secondary" className="shrink-0 font-mono tabular-nums">
        {count}
      </Badge>
    </header>
  );
}

function PipelineTournamentRow({
  tournament,
  status,
}: {
  tournament: TournamentListItem;
  status: TournamentStatus;
}) {
  const matchCount = tournament._count.actionableMatches;

  return (
    <li>
      <Link
        to="/dashboard/tournaments/$id"
        params={{ id: tournament.id }}
        aria-label={`Open ${tournament.name}`}
        className={cn(
          'group flex flex-col gap-1.5 border-l-2 border-l-transparent px-3 py-2.5',
          rowHoverAccent[status],
          'hover:bg-muted/40 smooth-hover transition-colors duration-200',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium">
            {tournament.name}
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="text-muted-foreground size-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
          />
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3" aria-hidden="true" />
            {tournament._count.groups} groups
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" aria-hidden="true" />
            {tournament._count.tournamentAthletes} athletes
          </span>
          <span className="inline-flex items-center gap-1">
            <LayoutGrid className="size-3" aria-hidden="true" />
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        </div>
        <span className="text-muted-foreground font-mono text-[10px]">
          Created{' '}
          {formatDistanceToNow(new Date(tournament.createdAt), {
            addSuffix: true,
          })}
        </span>
      </Link>
    </li>
  );
}

function PipelineStageEmpty({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Icon className="size-5 opacity-40" aria-hidden="true" />
      <p className="text-sm font-medium">
        No {label.toLowerCase()} tournaments
      </p>
      <p className="font-mono text-[10px]">Awaiting intake</p>
    </div>
  );
}

interface PipelineStageProps {
  status: TournamentStatus;
  label: string;
  subtitle: string;
  viewAllLabel: string;
  icon: LucideIcon;
  items: Array<TournamentListItem>;
  count: number;
}

function PipelineStage({
  status,
  label,
  subtitle,
  viewAllLabel,
  icon,
  items,
  count,
}: PipelineStageProps) {
  return (
    <div className="flex h-full min-w-[78vw] shrink-0 snap-center flex-col sm:min-w-[52vw] xl:min-w-0">
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col border-l-2',
          stageAccent[status]
        )}
      >
        <PipelineStageHeader
          status={status}
          label={label}
          subtitle={subtitle}
          count={count}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          {items.length === 0 ? (
            <PipelineStageEmpty label={label} icon={icon} />
          ) : (
            <ul className="divide-border/60 divide-y" role="list">
              {items.map((tournament) => (
                <PipelineTournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  status={status}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      <footer className="border-border/60 shrink-0 border-x border-t px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 px-2"
          asChild
        >
          <Link to="/dashboard/tournaments" search={{ status: [status] }}>
            {viewAllLabel}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </footer>
    </div>
  );
}

export function StatusPipeline({
  pipeline,
  statusCounts,
}: StatusPipelineProps) {
  return (
    <HubSection
      title="Status pipeline"
      description="Recent tournaments grouped by lifecycle stage"
      className="overflow-x-hidden! xl:overflow-visible"
      action={
        <Button variant="ghost" className="cursor-pointer" asChild>
          <Link to="/dashboard/tournaments">
            View all tournaments
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <PipelineFrame>
        <div className="divide-border/60 flex snap-x snap-mandatory divide-x overflow-x-auto xl:grid xl:snap-none xl:grid-cols-3 xl:divide-x-0 xl:overflow-visible">
          {columns.map((column) => (
            <PipelineStage
              key={column.status}
              status={column.status}
              label={column.label}
              subtitle={column.subtitle}
              viewAllLabel={column.viewAllLabel}
              icon={column.icon}
              items={pipeline[column.status]}
              count={statusCounts[column.status]}
            />
          ))}
        </div>
      </PipelineFrame>
    </HubSection>
  );
}
