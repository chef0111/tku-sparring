import type { GroupData } from '@/features/dashboard/types';
import type { LeaseSnapshot } from '@/queries/leases';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';

type LeaseEntry = LeaseSnapshot[number];

function leaseToStatusVariant(
  status: LeaseEntry['leaseStatus'] | undefined
): 'online' | 'offline' | 'degraded' | 'maintenance' {
  switch (status) {
    case 'held_by_me':
      return 'online';
    case 'held_by_other':
      return 'degraded';
    case 'pending_takeover':
      return 'maintenance';
    default:
      return 'online';
  }
}

function leaseHolderLabel(status: LeaseEntry['leaseStatus'] | undefined) {
  switch (status) {
    case 'held_by_me':
      return 'You';
    case 'held_by_other':
      return 'Locked';
    case 'pending_takeover':
      return 'Pending';
    default:
      return 'Free';
  }
}

export interface LeaseSummaryListProps {
  groups: Array<GroupData>;
  leaseMap: Map<string, LeaseEntry>;
}

export function LeaseSummaryList({ groups, leaseMap }: LeaseSummaryListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground p-3 text-sm">No groups yet.</div>
    );
  }

  return (
    <ul className="max-h-72 divide-y overflow-y-auto py-1">
      {groups.map((group) => {
        const lease = leaseMap.get(group.id);
        const variant = leaseToStatusVariant(lease?.leaseStatus);
        const holder = leaseHolderLabel(lease?.leaseStatus);
        return (
          <li
            key={group.id}
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate font-medium">
              {group.name}
            </span>
            <Status status={variant} className="gap-1.5">
              <StatusIndicator />
              <StatusLabel className="text-xs">{holder}</StatusLabel>
            </Status>
          </li>
        );
      })}
    </ul>
  );
}
