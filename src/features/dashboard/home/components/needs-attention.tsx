import { Link } from '@tanstack/react-router';
import type { AttentionItem } from '../lib/compute-dashboard-stats';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NeedsAttentionProps {
  items: Array<AttentionItem>;
}

export function NeedsAttention({ items }: NeedsAttentionProps) {
  if (items.length === 0) return null;

  return (
    <section className="bg-card flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Needs attention
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Alert key={`${item.tournamentId}-${item.kind}`}>
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
      </div>
    </section>
  );
}
