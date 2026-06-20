import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTimerStore } from '@/features/app/stores/timer-store';
import { useMatchStore } from '@/features/app/stores/match-store';

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

  const primeRound = useTimerStore((s) => s.primeRound);
  const nextRound = useMatchStore((s) => s.nextRound);

  const prevIsBreakTime = useRef(isBreakTime);

  useEffect(() => {
    const isMatchOver = redWon >= 2 || blueWon >= 2;

    if (
      prevIsBreakTime.current &&
      !isBreakTime &&
      breakTimeLeft === 0 &&
      !isMatchOver
    ) {
      primeRound(roundDuration);
      nextRound();
    }
    prevIsBreakTime.current = isBreakTime;
  }, [
    isBreakTime,
    breakTimeLeft,
    roundDuration,
    redWon,
    blueWon,
    primeRound,
    nextRound,
  ]);
};
