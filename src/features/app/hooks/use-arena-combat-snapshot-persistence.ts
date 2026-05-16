import * as React from 'react';

import {
  ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION,
  isLikelyMongoObjectId,
  saveArenaCombatSnapshot,
} from '@/features/app/lib/arena-combat-snapshot';
import { useSettings } from '@/contexts/settings';
import { completedRoundsFromWins } from '@/lib/tournament/bo3';
import { useMatchStore } from '@/stores/match-store';
import { usePlayerStore } from '@/stores/player-store';
import { useTimerStore } from '@/stores/timer-store';

export function useArenaCombatSnapshotPersistence() {
  const { formData, arenaAdvanceApplyNum } = useSettings();
  const advanceMatch = formData.advance.match;
  const advanceMatchRef = React.useRef(advanceMatch);
  advanceMatchRef.current = advanceMatch;

  React.useEffect(() => {
    if (typeof window === 'undefined' || arenaAdvanceApplyNum === 0) return;

    let timer = 0;

    const flush = () => {
      const matchId = advanceMatchRef.current;
      if (!matchId || !isLikelyMongoObjectId(matchId)) return;
      const { red, blue } = usePlayerStore.getState();
      const { redWon, blueWon } = useMatchStore.getState();
      const t = useTimerStore.getState();
      saveArenaCombatSnapshot(matchId, {
        schemaVersion: ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION,
        matchId,
        completedRounds: completedRoundsFromWins(redWon, blueWon),
        red: { health: red.health, mana: red.mana, fouls: red.fouls },
        blue: { health: blue.health, mana: blue.mana, fouls: blue.fouls },
        timer: {
          timeLeftMs: t.timeLeft,
          breakTimeLeftMs: t.breakTimeLeft,
          isBreakTime: t.isBreakTime,
          roundStarted: t.roundStarted,
          roundEnded: t.roundEnded,
          isRunning: t.isRunning,
        },
      });
    };

    const scheduleFlush = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 260);
    };

    const unsubPlayer = usePlayerStore.subscribe(scheduleFlush);
    const unsubTimer = useTimerStore.subscribe(scheduleFlush);

    const onPageHide = () => {
      window.clearTimeout(timer);
      flush();
    };
    window.addEventListener('pagehide', onPageHide);

    return () => {
      unsubPlayer();
      unsubTimer();
      window.removeEventListener('pagehide', onPageHide);
      window.clearTimeout(timer);
    };
  }, [arenaAdvanceApplyNum]);
}
