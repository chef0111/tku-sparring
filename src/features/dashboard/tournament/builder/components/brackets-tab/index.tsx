import * as React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useBracketsTabDnd } from '../../hooks/use-brackets-tab-dnd';
import { useBracketsTabQueries } from '../../hooks/use-brackets-tab-queries';
import { BracketCanvas } from './bracket-canvas';
import { BracketToolbar } from './bracket-toolbar';
import { EmptyBracketState } from './empty-bracket-state';
import { EmptyGroupsPlaceholder } from './empty-groups-placeholder';
import { ArenaGroupOrderSheet } from './groups-panel/arena-group-order-sheet';
import { GroupsPanel } from './groups-panel';
import { MatchDetailPanel } from './match-detail-panel';
import { LoadingBracketState } from './skeletons';
import type { GroupData, MatchData } from '@/features/dashboard/types';

export interface BracketsTabProps {
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
  tournamentStatus: string;
}

export function BracketsTab({
  tournamentId,
  groups,
  readOnly,
  tournamentStatus,
}: BracketsTabProps) {
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

  function handleSlotClick(match: MatchData) {
    setSelectedMatch(match);
    setPanelOpen(true);
  }

  if (groups.length === 0) {
    return <EmptyGroupsPlaceholder />;
  }

  return (
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
            <BracketCanvas
              matches={data.matches as Array<MatchData>}
              athletes={data.athletes}
              thirdPlaceMatch={data.selectedGroup?.thirdPlaceMatch ?? false}
              arenaNumberByMatchId={data.arenaNumberByMatchId}
              onSlotClick={handleSlotClick}
              readOnly={readOnly}
              showArenaOrderButton={data.showArenaOrderEntry}
              arenaOrderDisabled={data.arenaOrderEditBlocked}
              arenaOrderDisabledTooltip={data.arenaOrderDisabledTooltip}
              onOpenArenaOrder={() => setArenaOrderSheetOpen(true)}
            />
          )}
          <BracketToolbar
            groupId={selectedGroupId}
            disabled={data.toolbarDisabled}
            readOnly={readOnly}
            tournamentStatus={tournamentStatus}
          />
        </div>

        <GroupsPanel
          groups={groups}
          arenaGroupOrder={data.arenaGroupOrder}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          athletes={data.panelPoolAthletes}
          matches={data.matches as Array<MatchData>}
          onOpenMatch={handleSlotClick}
          readOnly={readOnly}
          isDraft={tournamentStatus === 'draft'}
          onOpenArenaOrder={() => setArenaOrderSheetOpen(true)}
          slotReturnEnabled={data.matches.length > 0}
          groupAthleteCount={data.athleteCount}
          isPoolLoading={data.isPoolLoading}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {dragLabel ? (
          <div className="bg-popover text-popover-foreground max-w-55 truncate rounded-md border px-3 py-2 text-sm shadow-md">
            {dragLabel.name}
          </div>
        ) : null}
      </DragOverlay>

      <MatchDetailPanel
        match={matchForDetailPanel}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        athletes={data.athletes}
        readOnly={readOnly}
        tournamentStatus={tournamentStatus}
        maxBracketRound={data.maxBracketRound}
      />

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
