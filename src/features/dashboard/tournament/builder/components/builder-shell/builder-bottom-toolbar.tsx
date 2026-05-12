import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  CheckCircle2,
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
  onRefresh?: () => void;
  onAutoAssignAll?: () => void;
  onLifecycle?: () => void;
  onEditTournament: () => void;
  onDeleteTournament: () => void;
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

export function BuilderBottomToolbar({
  tournament,
  leasedByMeCount,
  totalGroups,
  readOnly,
  onRefresh,
  onAutoAssignAll,
  onLifecycle,
  onEditTournament,
  onDeleteTournament,
  leasePopoverContent,
}: BuilderBottomToolbarProps) {
  const status = tournament.status;
  const showLifecycle = status !== 'completed';
  const lifecycleLabel =
    status === 'draft' ? 'Activate' : 'Complete tournament';
  const LifecycleIcon = status === 'draft' ? PlayCircle : CheckCircle2;

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

        <Separator orientation="vertical" className="mx-2 h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRefresh?.()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
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
            <DisabledWhenReadOnly readOnly={readOnly}>
              <Button
                variant="ghost"
                size="sm"
                disabled={readOnly}
                onClick={() => onLifecycle?.()}
                className="gap-2"
              >
                <LifecycleIcon className="size-4" />
                <span>{lifecycleLabel}</span>
              </Button>
            </DisabledWhenReadOnly>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
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

          <Separator orientation="vertical" className="mx-1 h-6" />

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
