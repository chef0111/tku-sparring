import * as React from 'react';

import { isServerMatchRowForSelectedBout } from '@/features/app/lib/arena-scoreboard-hydration-guard';
import {
  ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION,
  applyPersistedArenaTimerState,
  clearArenaCombatSnapshotForMatch,
  isLikelyMongoObjectId,
  readArenaCombatSnapshotForMatch,
  snapshotMatchesCompletedRounds,
} from '@/features/app/lib/arena-combat-snapshot';
import { useSettings } from '@/contexts/settings';
import { authClient } from '@/lib/auth-client';
import { useMatchGet } from '@/queries/matches';
import { useMatchStore } from '@/stores/match-store';
import { usePlayerStore } from '@/stores/player-store';
import { useTimerStore } from '@/stores/timer-store';

export function useArenaScoreboardHydration() {
  const { data: session } = authClient.useSession();
  const { formData, arenaAdvanceApplyNum } = useSettings();
  const matchId = formData.advance.match;
  const roundDurationMs = Math.max(1, formData.advance.roundDuration) * 1000;

  const hydrationEnabled =
    Boolean(session?.user) &&
    arenaAdvanceApplyNum > 0 &&
    Boolean(matchId && isLikelyMongoObjectId(matchId));

  const { data, isSuccess } = useMatchGet(matchId, hydrationEnabled);

  const appliedKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    appliedKeyRef.current = null;
  }, [matchId, arenaAdvanceApplyNum]);

  React.useEffect(() => {
    if (
      arenaAdvanceApplyNum === 0 ||
      !isSuccess ||
      !data ||
      !matchId ||
      !isLikelyMongoObjectId(matchId) ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const { redWins, blueWins } = data;
    if (!isServerMatchRowForSelectedBout(matchId, data)) {
      return;
    }

    const key = `${matchId}:${redWins}:${blueWins}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;

    useMatchStore.getState().hydrateFromServerScores({ redWins, blueWins });

    const snap = readArenaCombatSnapshotForMatch(matchId);
    if (!snap) {
      useTimerStore.getState().resetRoundStats(roundDurationMs);
      return;
    }

    if (!snapshotMatchesCompletedRounds(snap, redWins, blueWins)) {
      clearArenaCombatSnapshotForMatch(matchId);
      useTimerStore.getState().resetRoundStats(roundDurationMs);
      return;
    }

    if (snap.matchId !== matchId) {
      clearArenaCombatSnapshotForMatch(matchId);
      useTimerStore.getState().resetRoundStats(roundDurationMs);
      return;
    }

    usePlayerStore.setState((s) => ({
      red: {
        ...s.red,
        health: snap.red.health,
        mana: snap.red.mana,
        fouls: snap.red.fouls,
      },
      blue: {
        ...s.blue,
        health: snap.blue.health,
        mana: snap.blue.mana,
        fouls: snap.blue.fouls,
      },
    }));

    if (snap.schemaVersion === ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION) {
      applyPersistedArenaTimerState(snap.timer, roundDurationMs);
    } else {
      useTimerStore.getState().resetRoundStats(roundDurationMs);
    }
  }, [arenaAdvanceApplyNum, data, isSuccess, matchId, roundDurationMs]);
}
