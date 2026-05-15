import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  History,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import type {
  TournamentData,
  TournamentStatus,
} from '@/features/dashboard/types';
import { TOURNAMENT_STATUSES } from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BuilderBottomToolbarProps {
  tournament: TournamentData;
  readOnly: boolean;
  isRefreshing?: boolean;
  isSettingTournamentStatus?: boolean;
  onRefresh?: () => void;
  onAutoAssignAll?: () => void;
  onAdminStatusIntent: (next: TournamentStatus) => void;
  onEditTournament: () => void;
  onDeleteTournament: () => void;
  onActivity: () => void;
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

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

export function BuilderBottomToolbar({
  tournament,
  readOnly,
  isRefreshing,
  isSettingTournamentStatus,
  onRefresh,
  onAutoAssignAll,
  onAdminStatusIntent,
  onEditTournament,
  onDeleteTournament,
  onActivity,
}: BuilderBottomToolbarProps) {
  const status = tournament.status;

  return (
    <TooltipProvider delayDuration={200}>
      <footer className="bg-sidebar/70 supports-backdrop-filter:bg-sidebar/50 flex h-12 items-center gap-2 border-t px-4">
        <div className="flex items-center gap-2">
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

          <Select
            value={status}
            disabled={Boolean(isSettingTournamentStatus)}
            onValueChange={(v) => {
              onAdminStatusIntent(v as TournamentStatus);
            }}
          >
            <SelectTrigger size="sm" className="w-35">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TOURNAMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="mx-2 my-auto h-6" />

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
