import * as React from 'react';
import { BracketViewToolbar } from '../bracket-view-toolbar';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { Bracket } from '@/components/tournament-bracket/bracket';
import { useTournamentBracket } from '@/features/dashboard/tournament/builder/context/tournament-bracket/use-tournament-bracket';
import { usePanZoom } from '@/features/dashboard/tournament/builder/hooks/use-pan-zoom';
import { buildTwoSidedLayout } from '@/lib/tournament/bracket-layout';
import { useSetLock } from '@/queries/match';

export function BracketCanvas() {
  const {
    matches,
    athletes,
    selectedGroup,
    showArenaOrderEntry,
    arenaOrderEditBlocked,
    arenaOrderDisabledTooltip,
    setArenaOrderSheetOpen,
    matchLabel,
    handleSlotClick,
    readOnly,
  } = useTournamentBracket();

  const setLock = useSetLock();
  const thirdPlaceMatch = selectedGroup?.thirdPlaceMatch ?? false;
  const matchListFull = matches as Array<MatchData>;
  const matchList = matchListFull.filter((m) => m.kind !== 'custom');

  const athleteMap = React.useMemo(() => {
    const map = new Map<string, TournamentAthleteData>();
    for (const a of athletes) map.set(a.id, a);
    return map;
  }, [athletes]);

  const layoutSize = React.useMemo(
    () =>
      matchList.length === 0
        ? { width: 0, height: 0 }
        : buildTwoSidedLayout(matchList, thirdPlaceMatch),
    [matchList, thirdPlaceMatch]
  );

  const { containerRef, transform, handlers, reset, zoomIn, zoomOut } =
    usePanZoom(layoutSize.width, layoutSize.height);

  const onToggleLock = React.useCallback(
    (matchId: string, side: 'red' | 'blue', locked: boolean) => {
      setLock.mutate({ matchId, side, locked });
    },
    [setLock]
  );

  if (matchList.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative size-full min-h-0 overflow-hidden pl-6"
      {...handlers}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: layoutSize.width,
          height: layoutSize.height,
          position: 'relative',
        }}
      >
        <Bracket
          matches={matchList}
          thirdPlaceMatch={thirdPlaceMatch}
          athleteMap={athleteMap}
          matchLabel={matchLabel}
          readOnly={readOnly}
          onSlotClick={handleSlotClick}
          onToggleLock={onToggleLock}
        />
      </div>
      <BracketViewToolbar
        onFit={reset}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        showArenaOrderButton={showArenaOrderEntry}
        arenaOrderDisabled={arenaOrderEditBlocked}
        arenaOrderDisabledTooltip={arenaOrderDisabledTooltip}
        onOpenArenaOrder={() => setArenaOrderSheetOpen(true)}
      />
    </div>
  );
}
