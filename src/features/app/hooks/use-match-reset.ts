import { useCallback } from 'react';
import { usePlayerStore } from '@/stores/player-store';
import { useTimerStore } from '@/stores/timer-store';
import { useMatchStore } from '@/stores/match-store';

export function useMatchReset() {
  const { isBreakTime, reset } = useTimerStore();
  const { closeMatchResult, resetMatch: resetMatchStore } = useMatchStore();
  const { resetRoundStats, resetMatchStats } = usePlayerStore();

  const resetRound = useCallback(() => {
    if (isBreakTime) return;
    reset();
    resetRoundStats();
  }, [isBreakTime, reset, resetRoundStats]);

  const resetMatch = useCallback(() => {
    closeMatchResult();
    resetMatchStore();
    reset();
    resetMatchStats();
  }, [closeMatchResult, resetMatchStore, reset, resetMatchStats]);

  return { resetRound, resetMatch };
}
