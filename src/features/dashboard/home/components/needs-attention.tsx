import { Link } from '@tanstack/react-router';
import { HubSection, HubSectionBody } from './hub-panel';
import type { AttentionItem } from '../lib/compute-dashboard-stats';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NeedsAttentionProps {
  items: Array<AttentionItem>;
}

export function NeedsAttention({ items }: NeedsAttentionProps) {
  if (items.length === 0) return null;

  return (
    <HubSection title="Needs attention">
      <HubSectionBody className="flex flex-col gap-3">
        {items.map((item) => (
          <Alert
            key={`${item.tournamentId}-${item.kind}`}
            className="border-border/60 bg-muted/20"
          >
            <AlertTitle>{item.tournamentName}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{item.message}</span>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/dashboard/tournaments/$id/builder"
                  params={{ id: item.tournamentId }}
                >
                  Open Builder
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </HubSectionBody>
    </HubSection>
  );
}
