import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, ArrowUpRight, Trophy } from 'lucide-react';
import { HubSection } from './hub-panel';
import type { DashboardStats } from '../lib/compute-dashboard-stats';
import type {
  TournamentListItem,
  TournamentStatus,
} from '@/features/dashboard/types';
import type { StatusProps } from '@/components/ui/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { cn } from '@/lib/utils';

interface StatusPipelineProps {
  pipeline: DashboardStats['pipeline'];
}

const columns: Array<{
  status: TournamentStatus;
  label: string;
  subtitle: string;
  viewAllLabel: string;
}> = [
  {
    status: 'draft',
    label: 'Draft',
    subtitle: 'Setup in progress',
    viewAllLabel: 'View draft',
  },
  {
    status: 'active',
    label: 'Active',
    subtitle: 'Live operations',
    viewAllLabel: 'View active',
  },
  {
    status: 'completed',
    label: 'Completed',
    subtitle: 'Archived & read-only',
    viewAllLabel: 'View completed',
  },
];

const pipelineStatusVariant: Record<TournamentStatus, StatusProps['status']> = {
  draft: 'degraded',
  active: 'online',
  completed: 'maintenance',
};

function PipelineTournamentTile({
  tournament,
}: {
  tournament: TournamentListItem;
}) {
  const matchCount = tournament._count.actionableMatches;

  return (
    <li>
      <Card
        size="sm"
        className="group hover:ring-primary/30 py-0 shadow-none transition-colors duration-200"
      >
        <Link
          to="/dashboard/tournaments/$id"
          params={{ id: tournament.id }}
          aria-label={`Open ${tournament.name}`}
          className={cn(
            'flex cursor-pointer flex-col',
            'focus-visible:ring-ring space-y-2 rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
          )}
        >
          <CardHeader className="gap-1">
            <CardTitle className="truncate">{tournament.name}</CardTitle>
            <CardAction>
              <ArrowUpRight
                aria-hidden="true"
                className="text-muted-foreground group-hover:text-foreground size-5 opacity-60 transition-colors duration-200 group-hover:opacity-100"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-0">
            <CardDescription className="text-xs tabular-nums">
              {tournament._count.groups} groups ·{' '}
              {tournament._count.tournamentAthletes} athletes · {matchCount}{' '}
              {matchCount === 1 ? 'match' : 'matches'}
            </CardDescription>
            <CardDescription className="text-xs">
              Created{' '}
              {formatDistanceToNow(new Date(tournament.createdAt), {
                addSuffix: true,
              })}
            </CardDescription>
          </CardContent>
        </Link>
      </Card>
    </li>
  );
}

function PipelineColumnEmpty({ label }: { label: string }) {
  return (
    <Empty className="border-border/60 bg-muted/20 min-h-24 flex-1 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Trophy />
        </EmptyMedia>
        <EmptyTitle className="text-xs">
          No {label.toLowerCase()} tournaments
        </EmptyTitle>
        <EmptyDescription className="text-xs">
          Tournaments in this stage will appear here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function PipelineColumn({
  status,
  label,
  subtitle,
  viewAllLabel,
  items,
}: {
  status: TournamentStatus;
  label: string;
  subtitle: string;
  viewAllLabel: string;
  items: Array<TournamentListItem>;
}) {
  return (
    <Card
      size="sm"
      className="bg-drawer flex min-h-80 w-[85vw] shrink-0 snap-center flex-col gap-2! pt-2! pb-0! ring-0 sm:w-[60vw] lg:min-h-84 xl:w-auto"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Status
            status={pipelineStatusVariant[status]}
            className="gap-1.5 bg-transparent p-0 pl-1"
          >
            <StatusIndicator />
            <StatusLabel className="text-foreground text-sm font-medium">
              {label}
            </StatusLabel>
          </Status>
          <Badge variant="secondary" className="font-mono tabular-nums">
            {items.length}
          </Badge>
        </CardTitle>
        <CardAction className="my-auto">
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        </CardAction>
      </CardHeader>

      <CardContent className="bg-card/80 flex flex-1 flex-col gap-3 rounded-xl border py-4">
        {items.length === 0 ? (
          <PipelineColumnEmpty label={label} />
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {items.map((tournament) => (
              <PipelineTournamentTile
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </ul>
        )}

        <CardFooter className="mt-auto px-0! pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 cursor-pointer px-2"
            asChild
          >
            <Link to="/dashboard/tournaments" search={{ status: [status] }}>
              {viewAllLabel}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

export function StatusPipeline({ pipeline }: StatusPipelineProps) {
  return (
    <HubSection
      title="Status pipeline"
      description="Recent tournaments grouped by lifecycle stage"
      className="overflow-x-hidden! xl:overflow-visible"
      action={
        <Button variant="ghost" size="sm" className="cursor-pointer" asChild>
          <Link to="/dashboard/tournaments">
            View all tournaments
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1 lg:mx-0 lg:gap-4 lg:px-0 lg:pb-0 xl:grid xl:snap-none xl:grid-cols-3 xl:overflow-visible">
        {columns.map((column) => (
          <PipelineColumn
            key={column.status}
            status={column.status}
            label={column.label}
            subtitle={column.subtitle}
            viewAllLabel={column.viewAllLabel}
            items={pipeline[column.status]}
          />
        ))}
      </div>
    </HubSection>
  );
}
