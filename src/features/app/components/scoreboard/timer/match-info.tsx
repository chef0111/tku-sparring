import { cn } from '@/lib/utils';

interface MatchInfoProps {
  matchLabel: string;
  className?: string;
}

export const MatchInfo = ({ matchLabel, className }: MatchInfoProps) => {
  return (
    <div
      className={cn(
        'relative flex h-[13vh] w-full flex-col items-center justify-center',
        className
      )}
    >
      <h2 className="match-info max-w-full px-2 text-center text-6xl leading-[1.125] tracking-tight uppercase select-none! max-xl:text-5xl">
        {matchLabel}
      </h2>
    </div>
  );
};

interface RoundInfoProps {
  currentRound: number;
  className?: string;
}

export const RoundInfo = ({ currentRound, className }: RoundInfoProps) => {
  return (
    <div
      className={cn(
        'relative flex h-[19.5vh] w-full flex-col items-center justify-center',
        className
      )}
    >
      <h2 className="match-info text-5xl leading-[120%] select-none! max-xl:text-4xl">
        ROUND
      </h2>
      <h2 className="match-info text-7xl leading-none select-none! max-xl:text-6xl">
        {currentRound}
      </h2>
    </div>
  );
};
