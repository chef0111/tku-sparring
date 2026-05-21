import { Link } from '@tanstack/react-router';
import { LayoutGrid } from 'lucide-react';
import type { DashboardStats } from '../lib/compute-dashboard-stats';
import type { TournamentStatus } from '@/features/dashboard/types';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

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

export function StatusPipeline({ pipeline }: StatusPipelineProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Status pipeline
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(({ status, label }) => {
          const items = pipeline[status];
          return (
            <div
              key={status}
              className="bg-card flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              {items.length === 0 ? (
                <Empty className="border-none p-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LayoutGrid aria-hidden="true" />
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
                <ul className="flex flex-col gap-1">
                  {items.map((tournament) => (
                    <li key={tournament.id}>
                      <Link
                        to="/dashboard/tournaments/$id"
                        params={{ id: tournament.id }}
                        className="hover:bg-muted/50 flex min-w-0 flex-col gap-0.5 rounded-md px-2 py-2 transition-colors"
                      >
                        <span className="truncate text-sm font-medium">
                          {tournament.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {tournament._count.groups} groups ·{' '}
                          {tournament._count.tournamentAthletes} athletes
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-auto self-start"
                asChild
              >
                <Link to="/dashboard/tournaments">View all</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
