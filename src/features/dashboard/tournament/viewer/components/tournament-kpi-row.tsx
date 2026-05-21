import { Layers, Trophy, Users } from 'lucide-react';
import { MatchProgressBar } from './match-progress-bar';
import type { MatchTotals } from '../lib/compute-command-center';
import type { TournamentData } from '@/features/dashboard/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TournamentKpiRowProps {
  tournament: TournamentData;
  matchTotals: MatchTotals;
}

const tiles = [
  {
    key: 'groups',
    label: 'Groups',
    icon: Layers,
    getValue: (tournament: TournamentData) => tournament._count.groups,
  },
  {
    key: 'athletes',
    label: 'Athletes',
    icon: Users,
    getValue: (tournament: TournamentData) =>
      tournament._count.tournamentAthletes,
  },
  {
    key: 'matches',
    label: 'Matches',
    icon: Trophy,
    getValue: (tournament: TournamentData) => tournament._count.matches,
  },
] as const;

export function TournamentKpiRow({
  tournament,
  matchTotals,
}: TournamentKpiRowProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Tournament metrics
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile, index) => {
          const Icon = tile.icon;
          return (
            <Card
              key={tile.key}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {tile.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {tile.getValue(tournament)}
                </p>
              </CardContent>
            </Card>
          );
        })}
        <Card
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none"
          style={{ animationDelay: `${tiles.length * 75}ms` }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Match progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-2xl font-semibold tabular-nums">
              {matchTotals.complete}/{matchTotals.total}
            </p>
            <MatchProgressBar {...matchTotals} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
