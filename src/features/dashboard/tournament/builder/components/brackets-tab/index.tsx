import { DndContext, DragOverlay } from '@dnd-kit/core';
import { GripVertical, LockOpen } from 'lucide-react';
import { useTournamentBracket } from '../../context/tournament-bracket';
import { useBuilderWorkspace } from '../../context/builder-workspace';
import { BracketCanvas } from './bracket-canvas';
import { BracketToolbar } from './bracket-toolbar';
import { EmptyBracketState } from './empty-bracket-state';
import { ArenaGroupOrderSheet } from './groups-panel/arena-group-order-sheet';
import { GroupsPanel } from './groups-panel';
import { MatchDetailPanel } from './match-detail-panel';
import { LoadingBracketState } from './skeletons';
import { EmptyGroupsPlaceholder } from './empty-groups-placeholder';
import { getBeltLabel } from '@/config/athlete';

export function BracketsTab() {
  const {
    tournamentId,
    groups,
    readOnly,
    tournamentStatus,
    selectedGroupId,
    matchesQuery,
    matches,
    athleteCount,
    arenaOrderSheetOpen,
    setArenaOrderSheetOpen,
    sensors,
    onDragStart,
    onDragEnd,
    dragLabel,
  } = useTournamentBracket();

  const { groups: builderGroups } = useBuilderWorkspace();

  if (builderGroups.length === 0) {
    return <EmptyGroupsPlaceholder />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="canvas-background flex h-full min-h-0 w-full">
        <div className="relative min-h-0 min-w-0 flex-1">
          {matchesQuery.isPending ? (
            <LoadingBracketState />
          ) : matches.length === 0 ? (
            <EmptyBracketState
              groupId={selectedGroupId}
              readOnly={readOnly}
              tournamentStatus={tournamentStatus}
              athleteCount={athleteCount}
            />
          ) : (
            <BracketCanvas />
          )}
          <BracketToolbar />
        </div>

        <GroupsPanel />
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel && (
          <div className="bg-card flex cursor-grab items-center gap-2 rounded-md border px-2 py-2 text-sm active:cursor-grabbing data-dragging:cursor-grabbing">
            <button
              type="button"
              data-slot="panel-athlete-drag"
              className="text-muted-foreground flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm text-xs"
            >
              {dragLabel.kind === 'panel' ? (
                <GripVertical className="size-3.5" />
              ) : (
                <LockOpen className="size-3.5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{dragLabel.name}</p>
              {dragLabel.kind === 'panel' && (
                <p className="text-muted-foreground truncate text-xs">
                  {getBeltLabel(dragLabel.beltLevel)} · {dragLabel.weight} kg
                </p>
              )}
            </div>
          </div>
        )}
      </DragOverlay>

      <MatchDetailPanel />

      <ArenaGroupOrderSheet
        open={arenaOrderSheetOpen}
        onOpenChange={setArenaOrderSheetOpen}
        tournamentId={tournamentId}
        groups={groups}
        readOnly={readOnly}
      />
    </DndContext>
  );
}
