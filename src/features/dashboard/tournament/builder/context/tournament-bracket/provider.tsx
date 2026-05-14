import * as React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
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
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    groups[0]?.id ?? null
  );
  const [selectedMatch, setSelectedMatch] = React.useState<MatchData | null>(
    null
  );
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [arenaOrderSheetOpen, setArenaOrderSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0]!.id);
    }
    if (selectedGroupId && !groups.find((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(groups[0]?.id ?? null);
    }
  }, [groups, selectedGroupId]);

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

  const matchForDetailPanel = React.useMemo(() => {
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
      matchForDetailPanel,
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
    matchForDetailPanel,
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
        <div className="flex h-full min-h-0 w-full">
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
          {dragLabel ? (
            <div className="bg-popover text-popover-foreground max-w-55 truncate rounded-md border px-3 py-2 text-sm shadow-md">
              {dragLabel.name}
            </div>
          ) : null}
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
