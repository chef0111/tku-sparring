import type { MatchStatus } from '@/features/dashboard/types';
import { Status, StatusIndicator } from '@/components/ui/status';
import { cn } from '@/lib/utils';

const MATCH_STATUS_TONE: Record<
  MatchStatus,
  'online' | 'offline' | 'maintenance' | 'degraded'
> = {
  pending: 'maintenance',
  active: 'degraded',
  complete: 'online',
};

const LABEL: Record<MatchStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  complete: 'Complete',
};

export function MatchSheetStatus({
  status,
  className,
}: {
  status: MatchStatus;
  className?: string;
}) {
  const tone = MATCH_STATUS_TONE[status] ?? 'maintenance';

  return (
    <Status status={tone} className={cn(className)}>
      <StatusIndicator />
      <span className="text-foreground text-xs font-medium">
        {LABEL[status] ?? status}
      </span>
    </Status>
  );
}
