import * as React from 'react';
import { ActivityEventRow } from './activity-event-row';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTournamentActivityInfinite } from '@/queries/activity';

interface ActivityPanelProps {
  tournamentId: string;
  onViewAll: () => void;
}

export function ActivityPanel({ tournamentId, onViewAll }: ActivityPanelProps) {
  const query = useTournamentActivityInfinite({
    tournamentId,
    enabled: true,
  });

  const rows = React.useMemo(
    () => query.data?.pages.flatMap((page) => page.items).slice(0, 8) ?? [],
    [query.data]
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Recent activity
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View all
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {query.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {query.error?.message ?? 'Failed to load activity.'}
            </AlertDescription>
          </Alert>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <ActivityEventRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
