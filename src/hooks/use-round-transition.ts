import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BO3_WINS_NEEDED } from '@/lib/tournament/bo3';
import { useTimerStore } from '@/stores/timer-store';
import { useMatchStore } from '@/stores/match-store';

export const useRoundTransition = () => {
  const { isBreakTime, breakTimeLeft, roundDuration } = useTimerStore(
    useShallow((s) => ({
      isBreakTime: s.isBreakTime,
      breakTimeLeft: s.breakTimeLeft,
      roundDuration: s.roundDuration,
    }))
  );

  const { redWon, blueWon } = useMatchStore(
    useShallow((s) => ({
      redWon: s.redWon,
      blueWon: s.blueWon,
    }))
  );

  const resetRoundStats = useTimerStore((s) => s.resetRoundStats);
  const nextRound = useMatchStore((s) => s.nextRound);

  const prevIsBreakTime = useRef(isBreakTime);

  useEffect(() => {
    const isMatchOver = redWon >= BO3_WINS_NEEDED || blueWon >= BO3_WINS_NEEDED;

    if (
      prevIsBreakTime.current &&
      !isBreakTime &&
      breakTimeLeft === 0 &&
      !isMatchOver
    ) {
      resetRoundStats(roundDuration);
      nextRound();
    }
    prevIsBreakTime.current = isBreakTime;
  }, [
    isBreakTime,
    breakTimeLeft,
    roundDuration,
    redWon,
    blueWon,
    resetRoundStats,
    nextRound,
  ]);
};
