import { useMemo, useState } from 'react';
import { Plus, Search, Trophy } from 'lucide-react';
import { SiteHeader } from '../site-header';
import { TournamentCard } from './tournament-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateTournamentDialog } from '@/features/dashboard/tournament/create-tournament-dialog';
import { useTournaments } from '@/queries/tournaments';
import { Skeleton } from '@/components/ui/skeleton';

export function TournamentListPage() {
  const [search, setSearch] = useState('');
  const tournamentsQuery = useTournaments();
  const tournaments = tournamentsQuery.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return tournaments;
    const q = search.toLowerCase();
    return tournaments.filter((t) => t.name.toLowerCase().includes(q));
  }, [tournaments, search]);

  return (
    <div className="flex h-full flex-col">
      <SiteHeader title="Tournaments" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search tournaments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <CreateTournamentDialog>
              <Button>
                <Plus className="size-4" />
                Create Tournament
              </Button>
            </CreateTournamentDialog>
          </div>

          {tournamentsQuery.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <Trophy className="text-muted-foreground mb-4 size-12" />
              <h3 className="text-lg font-semibold">
                {search ? 'No tournaments found' : 'No tournaments yet'}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {search
                  ? 'Try a different search term.'
                  : 'Create your first tournament to get started.'}
              </p>
              {!search && (
                <CreateTournamentDialog>
                  <Button variant="outline">
                    <Plus className="mr-2 size-4" />
                    Create Tournament
                  </Button>
                </CreateTournamentDialog>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
