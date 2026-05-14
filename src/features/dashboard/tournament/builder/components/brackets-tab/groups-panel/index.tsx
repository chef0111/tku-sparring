import { useDroppable } from '@dnd-kit/core';
import { BetweenHorizonalEnd } from 'lucide-react';
import { GroupsPanelSkeleton } from '../skeletons';
import { ArenaOrderRailHint } from './arena-group-order-sheet/arena-order-rail-hint';
import { BracketActionQueue } from './bracket-action-queue';
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
import { cn } from '@/lib/utils';

interface GroupsPanelProps {
  groups: Array<GroupData>;
  arenaGroupOrder?: unknown;
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
  athletes: Array<TournamentAthleteData>;
  matches: Array<MatchData>;
  onOpenMatch: (match: MatchData) => void;
  readOnly: boolean;
  isDraft: boolean;
  onOpenArenaOrder: () => void;
  slotReturnEnabled: boolean;
  groupAthleteCount: number;
  isPoolLoading?: boolean;
  matchLabel: Map<string, number>;
}

export function GroupsPanel({
  groups,
  arenaGroupOrder,
  selectedGroupId,
  onSelect,
  athletes,
  matches,
  onOpenMatch,
  readOnly,
  isDraft,
  onOpenArenaOrder,
  slotReturnEnabled,
  groupAthleteCount,
  isPoolLoading = false,
  matchLabel,
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
    <aside className="bg-sidebar/50 flex h-full min-h-0 w-xs shrink-0 flex-col border-l">
      <GroupsTabsHeader
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelect={onSelect}
      />
      <ArenaOrderRailHint
        groups={groups}
        arenaGroupOrder={arenaGroupOrder}
        isDraft={isDraft}
        readOnly={readOnly}
        onEdit={onOpenArenaOrder}
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
            <GroupsPanelSkeleton showPanelHint={showArrangedHint} />
          ) : athletes.length > 0 ? (
            <>
              <header className="flex flex-col gap-1 px-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="bg-primary/80 size-1.5 shrink-0 rounded-full"
                    aria-hidden
                  />
                  <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {groups.find((g) => g.id === selectedGroupId)?.name}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs leading-snug">
                  Drag & drop athletes to bracket
                </p>
              </header>
              {athletes.map((a) => (
                <PanelAthleteRow
                  key={a.id}
                  athlete={a}
                  groupId={selectedGroupId ?? ''}
                  readOnly={readOnly}
                />
              ))}
            </>
          ) : matches.length > 0 ? (
            <BracketActionQueue
              matches={matches}
              onOpenMatch={onOpenMatch}
              showPanelHint={showArrangedHint}
              matchLabel={matchLabel}
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
