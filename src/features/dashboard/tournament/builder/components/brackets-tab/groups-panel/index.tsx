import { useDroppable } from '@dnd-kit/core';
import { BetweenHorizonalEnd } from 'lucide-react';
import { BracketActionQueueSection } from './bracket-action-queue-section';
import { GroupsTabsHeader } from './groups-tabs-header';
import { PanelAthleteRow } from './panel-athlete-row';
import type {
  GroupData,
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface GroupsPanelProps {
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
  athletes: Array<TournamentAthleteData>;
  matches: Array<MatchData>;
  onOpenMatch: (match: MatchData) => void;
  readOnly: boolean;
  slotReturnEnabled: boolean;
  groupAthleteCount: number;
  isPoolLoading?: boolean;
}

export function GroupsPanel({
  groups,
  selectedGroupId,
  onSelect,
  athletes,
  matches,
  onOpenMatch,
  readOnly,
  slotReturnEnabled,
  groupAthleteCount,
  isPoolLoading = false,
}: GroupsPanelProps) {
  const poolDrop = useDroppable({
    id: `bracket-panel-pool-${selectedGroupId ?? 'none'}`,
    disabled: readOnly || !selectedGroupId || !slotReturnEnabled,
    data: {
      from: 'panel-drop' as const,
      groupId: selectedGroupId,
    },
  });

  const showArrangedHint =
    slotReturnEnabled && !readOnly && groupAthleteCount > 0;

  return (
    <aside className="bg-sidebar/30 flex h-full min-h-0 w-xs shrink-0 flex-col border-l">
      <GroupsTabsHeader
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelect={onSelect}
      />
      <div
        ref={poolDrop.setNodeRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto transition-colors',
          poolDrop.isOver && slotReturnEnabled && !readOnly && 'bg-primary/5'
        )}
      >
        <div className="flex flex-col gap-1.5 p-2">
          {isPoolLoading ? (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card flex items-center gap-2 rounded-md border px-2 py-2"
                >
                  <Skeleton className="size-6 shrink-0 rounded-sm" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-full max-w-44" />
                    <Skeleton className="h-3 w-full max-w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : athletes.length > 0 ? (
            athletes.map((a) => (
              <PanelAthleteRow
                key={a.id}
                athlete={a}
                groupId={selectedGroupId ?? ''}
                readOnly={readOnly}
              />
            ))
          ) : matches.length > 0 ? (
            <BracketActionQueueSection
              matches={matches}
              onOpenMatch={onOpenMatch}
              showPanelHint={showArrangedHint}
            />
          ) : groupAthleteCount === 0 ? (
            <Empty className="border-none px-2 py-8">
              <EmptyHeader>
                <EmptyTitle>No athletes in this group</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : showArrangedHint ? (
            <Empty className="border-none px-2 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BetweenHorizonalEnd />
                </EmptyMedia>
                <EmptyTitle>All athletes are arranged</EmptyTitle>
                <EmptyDescription>
                  Drag from the bracket here to remove an athlete.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Empty className="border-none px-2 py-8">
              <EmptyHeader>
                <EmptyTitle>No athletes to show</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </aside>
  );
}
