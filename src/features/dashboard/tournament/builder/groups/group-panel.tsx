import * as React from 'react';
import { MoreHorizontal, Settings, Shuffle, UserMinus } from 'lucide-react';
import {
  GroupViolationCountBadge,
  OutOfRangeBadge,
  getViolations,
} from './out-of-range-badge';
import type {
  GroupData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { useTournamentAthletes } from '@/queries/tournament-athletes';
import {
  useAutoAssignGroup,
  useUnassignAthlete,
  useUpdateGroup,
} from '@/queries/groups';

type LeaseStatus =
  | 'available'
  | 'held_by_me'
  | 'held_by_other'
  | 'pending_takeover';

interface LeaseInfo {
  groupId: string;
  leaseStatus: LeaseStatus;
  adminId: string | null;
  deviceId: string | null;
  expiresAt: string | null;
}

interface GroupPanelProps {
  group: GroupData;
  tournamentId: string;
  readOnly: boolean;
  leaseInfo?: LeaseInfo;
  onOpenSettings: (group: GroupData) => void;
  onRequestTakeover?: (groupId: string) => void;
}

const ARENA_OPTIONS = [1, 2, 3];

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

function leaseLabel(status?: LeaseStatus): string {
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

export function GroupPanel({
  group,
  tournamentId,
  readOnly,
  leaseInfo,
  onOpenSettings,
  onRequestTakeover,
}: GroupPanelProps) {
  const { data: athletes, isPending } = useTournamentAthletes({
    tournamentId,
    groupId: group.id,
  });

  const autoAssign = useAutoAssignGroup();
  const updateGroup = useUpdateGroup();

  const groupAthletes = (athletes ?? []) as Array<TournamentAthleteData>;

  const violationCount = React.useMemo(
    () =>
      groupAthletes.filter((a) => getViolations(a, group).length > 0).length,
    [groupAthletes, group]
  );

  const hasMatches = group._count.matches > 0;
  const statusVariant = leaseToStatusVariant(leaseInfo?.leaseStatus);

  const handleArenaChange = (value: string) => {
    updateGroup.mutate({
      id: group.id,
      arenaIndex: Number(value),
    });
  };

  const handleAutoAssign = () => {
    autoAssign.mutate({ groupId: group.id, tournamentId });
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-2 space-y-0 border-b px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold">{group.name}</h4>
            <Badge variant="secondary" className="shrink-0">
              {group._count.tournamentAthletes}
            </Badge>
            <GroupViolationCountBadge count={violationCount} />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            {group.gender && (
              <Badge variant="outline" className="text-[10px]">
                {group.gender === 'M' ? 'Male' : 'Female'}
              </Badge>
            )}
            {(group.beltMin != null || group.beltMax != null) && (
              <Badge variant="outline" className="text-[10px]">
                Belt {group.beltMin ?? 0}–{group.beltMax ?? 10}
              </Badge>
            )}
            {(group.weightMin != null || group.weightMax != null) && (
              <Badge variant="outline" className="text-[10px]">
                {group.weightMin ?? 20}–{group.weightMax ?? 150}kg
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Status status={statusVariant} className="h-5 px-1.5">
            <StatusIndicator />
            <StatusLabel>{leaseLabel(leaseInfo?.leaseStatus)}</StatusLabel>
          </Status>

          {!readOnly &&
            leaseInfo?.leaseStatus === 'held_by_other' &&
            onRequestTakeover && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px]"
                onClick={() => onRequestTakeover(group.id)}
              >
                Take over
              </Button>
            )}

          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenSettings(group)}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAutoAssign}
                  disabled={autoAssign.isPending}
                >
                  <Shuffle className="mr-2 size-4" />
                  Auto-assign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <span className="text-muted-foreground text-[10px] font-medium">
          Arena
        </span>
        <Select
          value={String(group.arenaIndex)}
          onValueChange={handleArenaChange}
          disabled={readOnly || hasMatches}
        >
          <SelectTrigger className="h-6 w-20 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ARENA_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs">
                Arena {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasMatches && (
          <span className="text-muted-foreground text-[10px]">
            (locked — matches exist)
          </span>
        )}
      </div>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : groupAthletes.length === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center p-6 text-center text-xs">
            No athletes assigned
          </div>
        ) : (
          <div className="divide-y">
            {groupAthletes.map((athlete) => (
              <GroupAthleteRow
                key={athlete.id}
                athlete={athlete}
                group={group}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GroupAthleteRowProps {
  athlete: TournamentAthleteData;
  group: GroupData;
  readOnly: boolean;
}

function GroupAthleteRow({ athlete, group, readOnly }: GroupAthleteRowProps) {
  const unassign = useUnassignAthlete();
  const violations = getViolations(athlete, group);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{athlete.name}</p>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px]">
            {athlete.gender}
          </Badge>
          <span className="text-muted-foreground text-[10px]">
            Belt {athlete.beltLevel}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {athlete.weight}kg
          </span>
        </div>
      </div>

      <OutOfRangeBadge violations={violations} />

      {!readOnly && (
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={() => unassign.mutate({ tournamentAthleteId: athlete.id })}
          disabled={unassign.isPending}
        >
          <UserMinus className="size-3" />
        </Button>
      )}
    </div>
  );
}
