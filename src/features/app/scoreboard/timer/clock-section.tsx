import { cn, formatTime } from '@/lib/utils';

interface ClockSectionProps {
  time: number;
  showMilliseconds?: boolean;
  isBreakTime?: boolean;
  isPaused?: boolean;
  shouldBlink?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ClockSection = ({
  time,
  showMilliseconds = false,
  isBreakTime = false,
  isPaused = false,
  shouldBlink = false,
  onClick,
  className,
}: ClockSectionProps) => {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center justify-center',
        className
      )}
    >
      <TimeBox
        time={time}
        showMilliseconds={showMilliseconds}
        isBreakTime={isBreakTime}
        isPaused={isPaused}
        shouldBlink={shouldBlink}
        onClick={onClick}
      />
      <TimeoutIndicator isVisible={isPaused} isBreakTime={isBreakTime} />
    </div>
  );
};

interface TimeBoxProps {
  time: number;
  showMilliseconds?: boolean;
  isBreakTime?: boolean;
  isPaused?: boolean;
  shouldBlink?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TimeBox = ({
  time,
  showMilliseconds = false,
  isBreakTime = false,
  isPaused = false,
  shouldBlink = false,
  onClick,
  className,
}: TimeBoxProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-background relative flex w-full cursor-pointer items-center justify-center px-13 py-1.75 transition-all duration-100',
        isBreakTime
          ? 'border-foreground border-7'
          : 'border-7 border-yellow-500',
        className
      )}
    >
      <h1
        className={cn(
          'm-0 text-center text-8xl leading-none font-bold text-white select-none max-xl:text-7xl',
          shouldBlink && 'animate-timer-blink',
          isPaused && !isBreakTime && 'text-yellow-500'
        )}
      >
        {formatTime(time, showMilliseconds)}
      </h1>
    </div>
  );
};

interface TimeoutIndicatorProps {
  isVisible?: boolean;
  isBreakTime?: boolean;
  className?: string;
}

export const TimeoutIndicator = ({
  isVisible = false,
  isBreakTime = false,
  className,
}: TimeoutIndicatorProps) => {
  return (
    <div
      className={cn(
        'relative flex h-[9.5vh] w-full items-center justify-center gap-2.5 px-10.25 py-3.75 transition-all duration-100 max-xl:h-[8vh]',
        isBreakTime ? 'bg-foreground' : 'bg-yellow-500',
        isVisible ? 'visible opacity-100' : 'invisible opacity-0',
        className
      )}
    >
      <h2 className="text-background m-0 text-center text-6xl leading-none font-bold whitespace-nowrap select-none max-2xl:text-5xl max-xl:text-[44px]">
        Time out
      </h2>
    </div>
  );
};
