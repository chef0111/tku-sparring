import * as React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { GripVertical, LockOpen } from 'lucide-react';
import { useBuilderManagerQuery } from '../../hooks/use-builder-manager-query';
import { useBracketsTabDnd } from '../../hooks/use-brackets-tab-dnd';
import { useBracketsTabQueries } from '../../hooks/use-brackets-tab-queries';
import { BracketCanvas } from '../../components/brackets-tab/bracket-canvas';
import { BracketToolbar } from '../../components/brackets-tab/bracket-toolbar';
import { EmptyBracketState } from '../../components/brackets-tab/empty-bracket-state';
import { ArenaGroupOrderSheet } from '../../components/brackets-tab/groups-panel/arena-group-order-sheet';
import { GroupsPanel } from '../../components/brackets-tab/groups-panel';
import { MatchDetailPanel } from '../../components/brackets-tab/match-detail-panel';
import { LoadingBracketState } from '../../components/brackets-tab/skeletons';
import { TournamentBracketContext } from './context';
import type { GroupData, MatchData } from '@/features/dashboard/types';
import type { TournamentBracketContextValue } from './context';
import { getBeltLabel } from '@/config/athlete';

export interface TournamentBracketProviderProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  tournamentStatus: string;
}

function BracketShell({
  tournamentId,
  groups,
  readOnly,
  tournamentStatus,
}: TournamentBracketProviderProps) {
  const { selectedGroupId, setSelectedGroup: setSelectedGroupId } =
    useBuilderManagerQuery();

  const [selectedMatch, setSelectedMatch] = React.useState<MatchData | null>(
    null
  );
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [arenaOrderSheetOpen, setArenaOrderSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      void setSelectedGroupId(groups[0]!.id);
    }
    if (selectedGroupId && !groups.find((g) => g.id === selectedGroupId)) {
      void setSelectedGroupId(groups[0]?.id ?? null);
    }
  }, [groups, selectedGroupId, setSelectedGroupId]);

  const data = useBracketsTabQueries({
    tournamentId,
    groups,
    selectedGroupId,
    tournamentStatus,
    readOnly,
  });

  const { sensors, dragLabel, onDragStart, onDragEnd } = useBracketsTabDnd(
    data.athletes
  );

  const matchDetail = React.useMemo(() => {
    if (!selectedMatch) return null;
    return (
      (data.matches as Array<MatchData>).find(
        (m) => m.id === selectedMatch.id
      ) ?? selectedMatch
    );
  }, [data.matches, selectedMatch]);

  const handleSlotClick = React.useCallback((match: MatchData) => {
    setSelectedMatch(match);
    setPanelOpen(true);
  }, []);

  const isDraft = tournamentStatus === 'draft';

  const slotReturnEnabled = data.matches.length > 0;
  const showArrangedHint =
    slotReturnEnabled && !readOnly && data.athleteCount > 0;

  const value = React.useMemo((): TournamentBracketContextValue => {
    return {
      ...data,
      sensors,
      dragLabel,
      onDragStart,
      onDragEnd,
      tournamentId,
      groups,
      readOnly,
      tournamentStatus,
      isDraft,
      selectedGroupId,
      setSelectedGroupId,
      selectedMatch,
      setSelectedMatch,
      panelOpen,
      setPanelOpen,
      arenaOrderSheetOpen,
      setArenaOrderSheetOpen,
      handleSlotClick,
      matchDetail,
      slotReturnEnabled,
      showArrangedHint,
    };
  }, [
    data,
    sensors,
    dragLabel,
    onDragStart,
    onDragEnd,
    tournamentId,
    groups,
    readOnly,
    tournamentStatus,
    isDraft,
    selectedGroupId,
    selectedMatch,
    panelOpen,
    arenaOrderSheetOpen,
    handleSlotClick,
    matchDetail,
    slotReturnEnabled,
    showArrangedHint,
  ]);

  return (
    <TournamentBracketContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="canvas-background flex h-full min-h-0 w-full">
          <div className="relative min-h-0 min-w-0 flex-1">
            {data.matchesQuery.isPending ? (
              <LoadingBracketState />
            ) : data.matches.length === 0 ? (
              <EmptyBracketState
                groupId={selectedGroupId}
                readOnly={readOnly}
                tournamentStatus={tournamentStatus}
                athleteCount={data.athleteCount}
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
    </TournamentBracketContext.Provider>
  );
}

export function TournamentBracketProvider(
  props: TournamentBracketProviderProps
) {
  return <BracketShell {...props} />;
}
