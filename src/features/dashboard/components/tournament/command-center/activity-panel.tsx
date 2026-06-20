import * as React from 'react';
import { History } from 'lucide-react';
import { ActivityPanelSkeleton } from './loading';
import { ActivityEventRow } from './activity-event-row';
import {
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/components/home/hub-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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

  if (query.isLoading) {
    return <ActivityPanelSkeleton />;
  }

  return (
    <HubSection
      title="Recent activity"
      description="Latest tournament events"
      className="bg-popover ring-border/10 rounded-xl p-4 ring-1"
      action={
        <Button variant="outline" size="sm" onClick={onViewAll}>
          <History data-icon="inline-start" />
          View all
        </Button>
      }
    >
      <HubSectionContent padded={false}>
        {query.isError ? (
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
      </HubSectionContent>
    </HubSection>
  );
}
