import * as React from 'react';
import { useBuilderWorkspace } from '../builder-workspace/use-builder-workspace';
import { TournamentBracketContext } from './context';
import type { MatchData } from '@/contracts/tournament/match';
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
  const { tournamentId, divisions, readOnly, tournamentStatus } =
    useBuilderWorkspace();
  const { selectedDivisionId, setSelectedDivision: setSelectedDivisionId } =
    useBuilderManagerQuery();

  const [selectedMatch, setSelectedMatch] = React.useState<MatchData | null>(
    null
  );
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [arenaOrderSheetOpen, setArenaOrderSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!selectedDivisionId && divisions.length > 0) {
      void setSelectedDivisionId(divisions[0]!.id);
    }
    if (
      selectedDivisionId &&
      !divisions.find((d) => d.id === selectedDivisionId)
    ) {
      void setSelectedDivisionId(divisions[0]?.id ?? null);
    }
  }, [divisions, selectedDivisionId, setSelectedDivisionId]);

  const data = useBracketsTabQueries({
    tournamentId,
    divisions,
    selectedDivisionId,
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
      divisions,
      readOnly,
      tournamentStatus,
      isDraft,
      selectedDivisionId,
      setSelectedDivisionId,
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
    divisions,
    readOnly,
    tournamentStatus,
    isDraft,
    selectedDivisionId,
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
