import * as React from 'react';
import { BracketLayoutToggle } from './bracket-layout-toggle';
import { BracketViewToolbar } from './bracket-view-toolbar';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { useBracketChrome } from '@/features/dashboard/tournament/contexts/bracket-chrome';
import { useTournamentBracket } from '@/features/dashboard/tournament/contexts/tournament-bracket/use-tournament-bracket';
import { useBracketCanvasLayout } from '@/features/dashboard/tournament/hooks/use-bracket-canvas-layout';
import { usePanZoom } from '@/features/dashboard/tournament/hooks/use-pan-zoom';
import { Bracket } from '@/components/tournament-bracket/bracket';
import { useBracketLayout } from '@/hooks/use-bracket-layout';
import { useSetLock } from '@/queries/match';

export function BracketCanvas() {
  const {
    matches,
    athletes,
    selectedGroup,
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

  const [layoutMode, setLayoutMode] = useBracketCanvasLayout();

  const { layout, connectors } = useBracketLayout(matchList, thirdPlaceMatch, {
    layoutMode,
  });

  const { containerRef, transform, handlers, reset, zoomIn, zoomOut } =
    usePanZoom(layout.width, layout.height);

  const { setCaptureTarget } = useBracketChrome();
  const captureRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = captureRef.current;
    if (!root || matchList.length === 0) {
      setCaptureTarget(null);
      return;
    }
    setCaptureTarget({
      root,
      width: layout.width,
      height: layout.height,
    });
    return () => setCaptureTarget(null);
  }, [
    layout.width,
    layout.height,
    layoutMode,
    matchList.length,
    selectedGroup?.id,
    setCaptureTarget,
  ]);

  const handleLayoutModeChange = React.useCallback(
    (next: typeof layoutMode) => {
      setLayoutMode(next);
      reset();
    },
    [setLayoutMode, reset]
  );

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
      className="relative size-full min-h-0 overflow-hidden pl-2"
      {...handlers}
    >
      <div
        ref={captureRef}
        data-bracket-capture-root
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: layout.width,
          height: layout.height,
          position: 'relative',
        }}
      >
        <Bracket
          matches={matchList}
          thirdPlaceMatch={thirdPlaceMatch}
          layout={layout}
          connectors={connectors}
          layoutMode={layoutMode}
          athleteMap={athleteMap}
          matchLabel={matchLabel}
          readOnly={readOnly}
          onSlotClick={handleSlotClick}
          onToggleLock={onToggleLock}
        />
      </div>
      <BracketLayoutToggle
        value={layoutMode}
        onChange={handleLayoutModeChange}
      />
      <BracketViewToolbar onFit={reset} onZoomIn={zoomIn} onZoomOut={zoomOut} />
    </div>
  );
}
