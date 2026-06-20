import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/features/app/stores/timer-store';

export const useTimerTick = () => {
  const isRunning = useTimerStore((s) => s.isRunning);
  const isBreakTime = useTimerStore((s) => s.isBreakTime);
  const tick = useTimerStore((s) => s.tick);
  const tickBreak = useTimerStore((s) => s.tickBreak);

  const tickRef = useRef(tick);
  const tickBreakRef = useRef(tickBreak);
  tickRef.current = tick;
  tickBreakRef.current = tickBreak;

  useEffect(() => {
    if (isRunning && !isBreakTime) {
      const id = setInterval(() => tickRef.current(10), 10);
      return () => clearInterval(id);
    }
  }, [isRunning, isBreakTime]);

  useEffect(() => {
    if (isBreakTime && isRunning) {
      const id = setInterval(() => tickBreakRef.current(1000), 1000);
      return () => clearInterval(id);
    }
  }, [isBreakTime, isRunning]);
};
