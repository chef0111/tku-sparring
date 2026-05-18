import { useMatchStore } from './match-store';
import { usePlayerStore } from './player-store';
import { useTimerStore } from './timer-store';

/** Scoreboard: redo the current round; no-op during break between rounds. */
export function redoRound() {
  const timer = useTimerStore.getState();
  if (timer.isBreakTime) return;
  timer.reset();
  usePlayerStore.getState().resetRoundStats();
}

/** Scoreboard: reset in-memory Match scoring. */
export function replayMatch() {
  const match = useMatchStore.getState();
  match.closeMatchResult();
  match.resetMatch();
  useTimerStore.getState().reset();
  usePlayerStore.getState().resetMatchStats();
}

/** After Finish Match: full client reset for the next Advance Settings selection. */
export function afterFinish() {
  const match = useMatchStore.getState();
  match.closeMatchResult();
  match.resetMatch();
  useTimerStore.getState().reset();
  usePlayerStore.getState().resetAll();
}

/** After settings Apply: prime round countdown and reset match + full player state. */
export function prepArena(roundDurationMs: number) {
  useTimerStore.getState().primeRound(roundDurationMs);
  useMatchStore.getState().resetMatch();
  usePlayerStore.getState().resetAll();
}
