import type { TournamentStatus } from '@/features/dashboard/types';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { cn } from '@/lib/utils';

type StatusKey = 'online' | 'offline' | 'maintenance' | 'degraded';

const STATUS_KEY: Record<TournamentStatus, StatusKey> = {
  draft: 'degraded',
  active: 'online',
  completed: 'maintenance',
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

interface TournamentStatusPillProps {
  status: TournamentStatus;
  className?: string;
}

export function TournamentStatusPill({
  status,
  className,
}: TournamentStatusPillProps) {
  return (
    <Status
      status={STATUS_KEY[status]}
      className={cn('font-medium tracking-wide uppercase', className)}
    >
      <StatusIndicator />
      <StatusLabel>{STATUS_LABEL[status]}</StatusLabel>
    </Status>
  );
}
