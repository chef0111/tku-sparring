import { Link } from '@tanstack/react-router';
import { ArrowRight, Plus } from 'lucide-react';
import { TournamentCard } from '../tournament/tournament-card';
import { NoTournaments } from '../tournament/empty';
import { Header } from '../header';
import { Button } from '@/components/ui/button';
import { CreateTournamentDialog } from '@/modules/dashboard/tournament/create-tournament-dialog';
import { useTournaments } from '@/queries/tournaments';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardHome() {
  const { data, isPending } = useTournaments();

  const tournaments = data ?? [];

  return (
    <div className="flex h-full flex-col">
      <Header title="Dashboard" />

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
            <CreateTournamentDialog>
              <Button>
                <Plus className="size-4" />
                Create Tournament
              </Button>
            </CreateTournamentDialog>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Tournaments</h3>
              {tournaments.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/tournament">
                    View all
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-lg" />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <NoTournaments />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
