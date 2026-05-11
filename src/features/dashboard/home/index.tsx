import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Plus } from 'lucide-react';
import { TournamentCard } from '../tournament/list/components/tournaments-grid/tournament-card';
import { TournamentCardSkeleton } from '../tournament/list/components/tournaments-grid/tournament-card-skeleton';
import { TournamentsEmptyState } from '../tournament/list/components/tournaments-empty-state';
import { SiteHeader } from '../site-header';
import type { TournamentListItem } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { CreateTournamentDialog } from '@/features/dashboard/tournament/create-tournament-dialog';
import { useTournaments } from '@/queries/tournaments';

export function DashboardHome() {
  const { data, isPending } = useTournaments();
  const [open, setOpen] = useState(false);

  const tournaments = (data ?? []) as Array<TournamentListItem>;

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Dashboard" />

      <div className="flex-1 overflow-auto py-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h2>
              <p className="text-muted-foreground">
                Manage your Taekwondo tournaments from here
              </p>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create Tournament
            </Button>
            <CreateTournamentDialog open={open} onOpenChange={setOpen} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Tournaments</h3>
              {tournaments.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/tournaments">
                    View all
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {isPending ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TournamentCardSkeleton key={i} />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <TournamentsEmptyState variant="no-data" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.slice(0, 6).map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
