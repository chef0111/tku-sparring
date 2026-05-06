import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Edit, Layers, LayoutGrid, Trophy, Users } from 'lucide-react';
import type { GroupData, TournamentData } from '@/features/dashboard/types';
import { SiteHeader } from '@/features/dashboard/site-header';
import { Button } from '@/components/ui/button';

interface TournamentViewerProps {
  tournament: TournamentData;
  groups: Array<GroupData>;
  tournamentId: string;
}

export function TournamentViewer({
  tournament,
  groups,
  tournamentId,
}: TournamentViewerProps) {
  return (
    <div className="flex h-full flex-col">
      <SiteHeader
        title={
          <Link
            to="/dashboard/tournaments"
            className="text-muted-foreground hover:text-foreground"
          >
            Tournaments
          </Link>
        }
        action={tournament.name}
      >
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/dashboard/tournaments/$id/builder"
              params={{ id: tournamentId }}
            >
              <Edit className="mr-1 size-4" />
              Edit Tournament
            </Link>
          </Button>
        </div>
      </SiteHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Layers}
              label="Groups"
              value={tournament._count.groups}
            />
            <StatCard
              icon={Users}
              label="Athletes"
              value={tournament._count.tournamentAthletes}
            />
            <StatCard
              icon={Trophy}
              label="Matches"
              value={tournament._count.matches}
            />
          </div>

          {/* Athletes per group */}
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <LayoutGrid className="text-muted-foreground mb-4 size-10" />
                <p className="text-muted-foreground text-sm">
                  No groups yet. Switch to builder mode to add groups.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link
                    to="/dashboard/tournaments/$id/builder"
                    params={{ id: tournamentId }}
                  >
                    Open Builder
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground text-sm">
                  Select a group to view athletes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
