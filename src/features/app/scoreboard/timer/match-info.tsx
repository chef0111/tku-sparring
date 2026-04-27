import { cn } from '@/lib/utils';

interface MatchInfoProps {
  matchId: string;
  className?: string;
}

export const MatchInfo = ({ matchId, className }: MatchInfoProps) => {
  return (
    <div
      className={cn(
        'relative flex h-[13vh] w-full flex-col items-center justify-start',
        className
      )}
    >
      <h2 className="match-info text-5xl leading-[120%] max-xl:text-4xl">
        MATCH
      </h2>
      <h2 className="match-info text-6xl leading-none max-xl:text-5xl">
        {matchId.padStart(3, '0')}
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
      <h2 className="match-info text-5xl leading-[120%] max-xl:text-4xl">
        ROUND
      </h2>
      <h2 className="match-info text-7xl leading-none max-xl:text-6xl">
        {currentRound}
      </h2>
    </div>
  );
};
