import type { MatchTotals } from '../lib/compute-command-center';

export function MatchProgressBar({
  pending,
  active,
  complete,
  total,
}: MatchTotals) {
  if (total === 0)
    return <div className="bg-muted h-1.5 w-full rounded-full" />;

  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div
      className="bg-muted flex h-1.5 w-full overflow-hidden rounded-full"
      role="progressbar"
      aria-valuenow={complete}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${complete} of ${total} matches complete`}
    >
      <div
        className="bg-muted-foreground/30 h-full"
        style={{ width: pct(pending) }}
      />
      <div className="bg-primary/70 h-full" style={{ width: pct(active) }} />
      <div className="bg-primary h-full" style={{ width: pct(complete) }} />
    </div>
  );
}
