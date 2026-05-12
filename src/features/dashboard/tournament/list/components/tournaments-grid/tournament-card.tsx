import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';

import { TournamentsActionMenu } from '../tournaments-table/tournaments-action-menu';
import { TournamentStatusPill } from '../tournament-status-pill';
import type { Row } from '@tanstack/react-table';
import type {
  TournamentListItem,
  TournamentRowActionOptions,
} from '@/features/dashboard/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TournamentCardProps {
  tournament: TournamentListItem;
  onRowAction?: TournamentRowActionOptions['onRowAction'];
}

function adaptToRow(tournament: TournamentListItem): Row<TournamentListItem> {
  return { original: tournament } as Row<TournamentListItem>;
}

export function TournamentCard({
  tournament,
  onRowAction,
}: TournamentCardProps) {
  const row = adaptToRow(tournament);

  return (
    <Card className="group bg-popover/70 relative gap-0 rounded-lg border-none p-0 ring-0">
      {onRowAction ? (
        <div className="absolute top-1 right-1 z-20 p-0">
          <TournamentsActionMenu options={{ onRowAction }} row={row} />
        </div>
      ) : null}
      <Link
        to="/dashboard/tournaments/$id"
        params={{ id: tournament.id }}
        aria-label={`Open ${tournament.name}`}
      >
        <CardContent className="hover:border-primary/30 bg-card hover:bg-muted/50 gap-0 space-y-4 rounded-lg border p-4 transition-colors">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="truncate font-semibold">
              {tournament.name}
            </CardTitle>
            <CardDescription className="truncate font-mono text-xs">
              {tournament.id.slice(-12)}
            </CardDescription>
          </CardHeader>
          <p className="text-muted-foreground relative text-xs">
            {tournament._count.groups} groups ·{' '}
            {tournament._count.tournamentAthletes} athletes ·{' '}
            {tournament._count.matches} matches
          </p>
        </CardContent>
      </Link>
      <CardFooter className="relative flex w-full items-center justify-between p-2">
        <TournamentStatusPill status={tournament.status} />
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(tournament.createdAt), {
            addSuffix: true,
          })}
        </span>
      </CardFooter>
    </Card>
  );
}
