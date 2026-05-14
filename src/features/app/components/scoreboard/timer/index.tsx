import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHotkeys } from 'react-hotkeys-hook';
import { SkipForward } from 'lucide-react';
import { ClockSection } from './clock-section';
import { MatchInfo, RoundInfo } from './match-info';
import { cn } from '@/lib/utils';
import { useTimerStore } from '@/stores/timer-store';
import { useMatchStore } from '@/stores/match-store';
import { useTimerTick } from '@/hooks/use-timer-tick';
import { useRoundTransition } from '@/hooks/use-round-transition';
import { useDeclareWinner } from '@/hooks/use-winner';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/settings';

export const Timer = () => {
  const {
    timeLeft,
    isRunning,
    isBreakTime,
    breakTimeLeft,
    roundEnded,
    roundStarted,
    toggle,
    toggleBreak,
    skipBreak,
    pause,
  } = useTimerStore(
    useShallow((s) => ({
      timeLeft: s.timeLeft,
      isRunning: s.isRunning,
      isBreakTime: s.isBreakTime,
      breakTimeLeft: s.breakTimeLeft,
      roundEnded: s.roundEnded,
      roundStarted: s.roundStarted,
      toggle: s.toggle,
      toggleBreak: s.toggleBreak,
      skipBreak: s.skipBreak,
      pause: s.pause,
    }))
  );

  const { matchLabel, currentRound, isMatchOver } = useMatchStore(
    useShallow((s) => ({
      matchLabel: s.matchLabel,
      currentRound: s.currentRound,
      isMatchOver: s.isMatchOver,
    }))
  );

  const { isOpen } = useSettings();

  useTimerTick();
  useRoundTransition();

  const { declareWinner } = useDeclareWinner();

  useEffect(() => {
    if (isMatchOver && isBreakTime && isRunning) {
      pause();
    }
  }, [isMatchOver, isBreakTime, isRunning, pause]);

  useHotkeys(
    'space',
    (e) => {
      if (isOpen) return;

      e.preventDefault();
      if (isBreakTime && !isMatchOver) {
        toggleBreak();
      } else if (roundEnded && !isMatchOver) {
        declareWinner();
      } else if (!roundEnded && !isMatchOver) {
        toggle();
      }
    },
    [
      isOpen,
      isBreakTime,
      roundEnded,
      isMatchOver,
      toggle,
      toggleBreak,
      declareWinner,
    ]
  );

  const handleTimeBoxClick = useCallback(() => {
    if (isMatchOver) return;
    if (isBreakTime) {
      toggleBreak();
    } else if (!roundEnded) {
      toggle();
    }
  }, [isBreakTime, roundEnded, isMatchOver, toggle, toggleBreak]);

  const displayTime = isBreakTime ? breakTimeLeft : timeLeft;
  const showMilliseconds = !isBreakTime && timeLeft < 10000 && timeLeft > 0;
  const shouldBlink = !isBreakTime && timeLeft < 10000;
  const isPaused = !isRunning && !isBreakTime && timeLeft > 0 && roundStarted;

  const handleSkipBreak = useCallback(() => {
    if (!isMatchOver) {
      skipBreak();
    }
  }, [isMatchOver, skipBreak]);

  return (
    <TimerFrame>
      <MatchInfo matchLabel={matchLabel} />
      <div className="relative flex h-54 w-full flex-col items-center justify-center">
        <ClockSection
          time={displayTime}
          showMilliseconds={showMilliseconds}
          isBreakTime={isBreakTime}
          isPaused={isPaused}
          shouldBlink={shouldBlink}
          onClick={handleTimeBoxClick}
        />
        {isBreakTime && (
          <Button
            variant="ghost"
            size="lg"
            className="absolute bottom-10 rounded-sm select-none"
            onClick={handleSkipBreak}
          >
            <SkipForward />
            Skip breaktime
          </Button>
        )}
      </div>
      <RoundInfo currentRound={currentRound} />
    </TimerFrame>
  );
};

interface TimerFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const TimerFrame = ({ children, className }: TimerFrameProps) => {
  return (
    <div
      className={cn(
        'bg-background relative flex h-full w-1/5 flex-col items-center justify-start gap-[8.5vh]',
        className
      )}
    >
      {children}
    </div>
  );
};

export { ClockSection, TimeBox, TimeoutIndicator } from './clock-section';
export { MatchInfo, RoundInfo } from './match-info';
