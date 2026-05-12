import { Settings } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { GroupData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { Status, StatusIndicator } from '@/components/ui/status';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type LeaseStatus =
  | 'available'
  | 'held_by_me'
  | 'held_by_other'
  | 'pending_takeover';

interface LeaseInfo {
  leaseStatus: LeaseStatus;
}

interface GroupRailRowProps {
  group: GroupData;
  active: boolean;
  readOnly: boolean;
  leaseInfo?: LeaseInfo;
  onSelect: (groupId: string) => void;
  onOpenSettings: (group: GroupData) => void;
}

function leaseToStatusVariant(
  status?: LeaseStatus
): 'online' | 'offline' | 'degraded' | 'maintenance' {
  switch (status) {
    case 'held_by_me':
      return 'online';
    case 'held_by_other':
      return 'degraded';
    case 'pending_takeover':
      return 'maintenance';
    default:
      return 'offline';
  }
}

function constraintSummary(group: GroupData): string | null {
  const parts: Array<string> = [];
  if (group.gender) parts.push(group.gender === 'M' ? 'Male' : 'Female');
  if (group.beltMin != null || group.beltMax != null) {
    parts.push(`Belt ${group.beltMin ?? 0}–${group.beltMax ?? 10}`);
  }
  if (group.weightMin != null || group.weightMax != null) {
    parts.push(`${group.weightMin ?? 20}–${group.weightMax ?? 150}kg`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function GroupRailRow({
  group,
  active,
  readOnly,
  leaseInfo,
  onSelect,
  onOpenSettings,
}: GroupRailRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: { groupId: group.id },
  });

  const summary = constraintSummary(group);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'hover:bg-muted/40 relative flex items-center border-l-2 border-transparent',
        active && 'border-primary bg-muted/50',
        isOver && 'bg-primary/10'
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onSelect(group.id)}
            className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
          >
            <Status
              status={leaseToStatusVariant(leaseInfo?.leaseStatus)}
              className="h-2 w-2 shrink-0 px-0"
            >
              <StatusIndicator />
            </Status>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {group.name}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {group._count.tournamentAthletes}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{group.name}</span>
            {summary && <span className="text-xs">{summary}</span>}
          </div>
        </TooltipContent>
      </Tooltip>
      {active && !readOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 size-6 shrink-0"
          onClick={() => onOpenSettings(group)}
          aria-label="Group settings"
        >
          <Settings className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
