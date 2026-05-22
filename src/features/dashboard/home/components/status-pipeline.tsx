import { Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight, Trophy } from 'lucide-react';
import { HubSection, HubSectionBody, HubSectionHeader } from './hub-panel';
import type { DashboardStats } from '../lib/compute-dashboard-stats';
import type { TournamentStatus } from '@/features/dashboard/types';
import type { StatusProps } from '@/components/ui/status';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';

interface StatusPipelineProps {
  pipeline: DashboardStats['pipeline'];
}

const columns: Array<{
  status: TournamentStatus;
  label: string;
}> = [
  { status: 'draft', label: 'Draft' },
  { status: 'active', label: 'Active' },
  { status: 'completed', label: 'Completed' },
];

const pipelineStatusVariant: Record<TournamentStatus, StatusProps['status']> = {
  draft: 'degraded',
  active: 'online',
  completed: 'maintenance',
};

export function StatusPipeline({ pipeline }: StatusPipelineProps) {
  return (
    <HubSection title="Status pipeline">
      <div className="lg:divide-border/50 grid lg:grid-cols-3 lg:divide-x">
        {columns.map(({ status, label }) => {
          const items = pipeline[status];
          return (
            <div key={status} className="flex flex-col">
              <HubSectionHeader
                title={
                  <Status
                    status={pipelineStatusVariant[status]}
                    className="bg-transparent p-0"
                  >
                    <StatusIndicator />
                    <StatusLabel className="text-foreground text-sm tabular-nums">
                      {items.length} {label.toLowerCase()}
                    </StatusLabel>
                  </Status>
                }
              />
              <HubSectionBody className="bg-background flex min-h-45 flex-1 flex-col gap-2 p-3">
                {items.length === 0 ? (
                  <Empty className="flex-1 border-none p-4">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Trophy aria-hidden="true" />
                      </EmptyMedia>
                      <EmptyTitle>
                        No {label.toLowerCase()} tournaments
                      </EmptyTitle>
                      <EmptyDescription>
                        Tournaments in this status will appear here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {items.map((tournament) => (
                      <li key={tournament.id}>
                        <Link
                          to="/dashboard/tournaments/$id"
                          params={{ id: tournament.id }}
                          className="group hover:bg-muted/50 relative flex min-w-0 flex-col gap-0.5 rounded-lg px-3 py-2 transition-colors"
                        >
                          <span className="truncate text-sm font-medium">
                            {tournament.name}
                          </span>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {tournament._count.groups} groups ·{' '}
                            {tournament._count.tournamentAthletes} athletes
                          </span>
                          <ArrowUpRight className="text-muted-foreground absolute top-3 right-3 size-4 scale-0 opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground mt-auto gap-2 self-start"
                  asChild
                >
                  <Link to="/dashboard/tournaments">
                    View all <ArrowRight />
                  </Link>
                </Button>
              </HubSectionBody>
            </div>
          );
        })}
      </div>
    </HubSection>
  );
}
