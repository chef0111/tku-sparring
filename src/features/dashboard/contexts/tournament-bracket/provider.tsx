import * as React from 'react';
import { useBuilderWorkspace } from '../builder-workspace/use-builder-workspace';
import { TournamentBracketContext } from './context';
import type { MatchData } from '@/features/dashboard/types';
import type { TournamentBracketContextValue } from './context';
import { useBuilderManagerQuery } from '@/features/dashboard/hooks/use-builder-manager-query';
import { useBracketsTabDnd } from '@/features/dashboard/hooks/use-brackets-tab-dnd';
import { useBracketsTabQueries } from '@/features/dashboard/hooks/use-brackets-tab-queries';

export interface TournamentBracketProviderProps {
  children: React.ReactNode;
}

export function TournamentBracketProvider({
  children,
}: TournamentBracketProviderProps) {
  const { tournamentId, groups, readOnly, tournamentStatus } =
    useBuilderWorkspace();
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
      {children}
    </TournamentBracketContext.Provider>
  );
}
