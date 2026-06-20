import { DndContext, DragOverlay } from '@dnd-kit/core';
import { GripVertical, LockOpen } from 'lucide-react';
import { EdgeReveal } from '../builder-shell/edge-reveal';
import { BracketCanvas } from './bracket-canvas';
import { BracketScreenshotDialog } from './bracket-screenshot-dialog';
import { BracketToolbar } from './bracket-toolbar';
import { EmptyBracketState } from './empty-bracket-state';
import { ArenaDivisionOrderSheet } from './divisions-panel/arena-division-order-sheet';
import { DivisionsPanel } from './divisions-panel';
import { MatchDetailPanel } from './match-detail-panel';
import { LoadingBracketState } from './skeletons';
import { EmptyDivisionsPlaceholder } from './empty-divisions-placeholder';
import { useBracketChrome } from '@/features/dashboard/contexts/bracket-chrome';
import { useBuilderWorkspace } from '@/features/dashboard/contexts/builder-workspace';
import { useTournamentBracket } from '@/features/dashboard/contexts/tournament-bracket';
import { getBeltLabel } from '@/config/athlete';

export function BracketsTab() {
  const {
    tournamentId,
    divisions,
    readOnly,
    tournamentStatus,
    selectedDivisionId,
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

  const { divisions: builderDivisions } = useBuilderWorkspace();
  const { isFullscreen } = useBracketChrome();

  if (builderDivisions.length === 0) {
    return <EmptyDivisionsPlaceholder />;
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
              divisionId={selectedDivisionId}
              readOnly={readOnly}
              tournamentStatus={tournamentStatus}
              athleteCount={athleteCount}
            />
          ) : (
            <BracketCanvas />
          )}
          <BracketToolbar />
        </div>

        {isFullscreen ? (
          <EdgeReveal edge="right">
            <DivisionsPanel />
          </EdgeReveal>
        ) : (
          <DivisionsPanel />
        )}
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

      <BracketScreenshotDialog />

      <ArenaDivisionOrderSheet
        open={arenaOrderSheetOpen}
        onOpenChange={setArenaOrderSheetOpen}
        tournamentId={tournamentId}
        divisions={divisions}
        readOnly={readOnly}
      />
    </DndContext>
  );
}
