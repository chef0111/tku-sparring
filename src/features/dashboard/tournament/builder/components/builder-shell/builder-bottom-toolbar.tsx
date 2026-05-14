import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle2,
  History,
  Lock,
  PlayCircle,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import type { TournamentData } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BuilderBottomToolbarProps {
  tournament: TournamentData;
  leasedByMeCount: number;
  totalGroups: number;
  readOnly: boolean;
  isRefreshing?: boolean;
  canCompleteTournament?: boolean;
  onRefresh?: () => void;
  onAutoAssignAll?: () => void;
  onLifecycle?: () => void;
  onEditTournament: () => void;
  onDeleteTournament: () => void;
  onActivity: () => void;
  leasePopoverContent?: React.ReactNode;
}

function DisabledWhenReadOnly({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: React.ReactElement;
}) {
  if (!readOnly) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>Tournament completed</TooltipContent>
    </Tooltip>
  );
}

function LifecycleButtonWrapper({
  readOnly,
  blockedByReadiness,
  children,
}: {
  readOnly: boolean;
  blockedByReadiness: boolean;
  children: React.ReactElement;
}) {
  if (readOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent>Tournament completed</TooltipContent>
      </Tooltip>
    );
  }
  if (blockedByReadiness) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent>
          All groups must have winners before completing.
        </TooltipContent>
      </Tooltip>
    );
  }
  return children;
}

export function BuilderBottomToolbar({
  tournament,
  leasedByMeCount,
  totalGroups,
  readOnly,
  isRefreshing,
  canCompleteTournament,
  onRefresh,
  onAutoAssignAll,
  onLifecycle,
  onEditTournament,
  onDeleteTournament,
  leasePopoverContent,
  onActivity,
}: BuilderBottomToolbarProps) {
  const status = tournament.status;
  const showLifecycle = status !== 'completed';
  const lifecycleLabel =
    status === 'draft' ? 'Activate' : 'Complete tournament';
  const LifecycleIcon = status === 'draft' ? PlayCircle : CheckCircle2;
  const lifecycleBlockedByReadiness =
    status === 'active' && canCompleteTournament === false;

  const leaseDisabled = totalGroups === 0;

  return (
    <TooltipProvider delayDuration={200}>
      <footer className="bg-sidebar/70 supports-backdrop-filter:bg-sidebar/50 flex h-12 items-center gap-2 border-t px-4">
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={leaseDisabled}
                className="gap-2"
              >
                <Lock className="size-4" />
                <span>
                  {leasedByMeCount}/{totalGroups} locked by you
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0">
              {leasePopoverContent ?? (
                <div className="text-muted-foreground p-3 text-sm">
                  No groups yet.
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="mx-2 my-auto h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRefresh?.()}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={isRefreshing ? 'size-4 animate-spin' : 'size-4'}
            />
            <span>Refresh</span>
          </Button>

          <DisabledWhenReadOnly readOnly={readOnly}>
            <Button
              variant="ghost"
              size="sm"
              disabled={readOnly}
              onClick={() => onAutoAssignAll?.()}
              className="gap-2"
            >
              <Zap className="size-4" />
              <span>Auto-assign all</span>
            </Button>
          </DisabledWhenReadOnly>

          {showLifecycle && (
            <LifecycleButtonWrapper
              readOnly={readOnly}
              blockedByReadiness={lifecycleBlockedByReadiness}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={readOnly || lifecycleBlockedByReadiness}
                onClick={() => onLifecycle?.()}
                className="gap-2"
              >
                <LifecycleIcon className="size-4" />
                <span>{lifecycleLabel}</span>
              </Button>
            </LifecycleButtonWrapper>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" type="button" onClick={onActivity}>
            <History className="mr-1 size-4" />
            Activity
          </Button>
          <DisabledWhenReadOnly readOnly={readOnly}>
            <Button
              variant="ghost"
              size="sm"
              disabled={readOnly}
              onClick={onEditTournament}
              className="gap-2"
            >
              <Settings className="size-4" />
              <span>Edit Tournament</span>
            </Button>
          </DisabledWhenReadOnly>

          <DisabledWhenReadOnly readOnly={readOnly}>
            <Button
              variant="ghost"
              size="sm"
              disabled={readOnly}
              onClick={onDeleteTournament}
              className="text-destructive hover:text-destructive gap-2"
            >
              <Trash2 className="size-4" />
              <span>Delete</span>
            </Button>
          </DisabledWhenReadOnly>

          <Separator orientation="vertical" className="mx-2 my-auto h-6" />

          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link
              to="/dashboard/tournaments/$id"
              params={{ id: tournament.id }}
            >
              <ArrowLeft className="size-4" />
              <span>Back to Detail</span>
            </Link>
          </Button>
        </div>
      </footer>
    </TooltipProvider>
  );
}
