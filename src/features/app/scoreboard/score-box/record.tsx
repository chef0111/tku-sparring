import { Ring } from '@/components/ui/ring';
import { cn } from '@/lib/utils';

interface RecordProps {
  roundScores: Array<number>;
  roundWinners: Array<Player | null>;
  player: Player;
  side?: 'red' | 'blue';
  currentRound: number;
  isBreakTime?: boolean;
  className?: string;
}

export const Record = ({
  roundScores,
  roundWinners,
  player,
  side,
  currentRound,
  isBreakTime = false,
  className,
}: RecordProps) => {
  const roundsToShow = isBreakTime
    ? currentRound
    : currentRound > 1
      ? currentRound - 1
      : 0;

  if (roundsToShow === 0) {
    return <div className={cn('h-45 w-full', className)} />;
  }

  return (
    <div
      className={cn(
        'flex h-45 w-full flex-col items-start justify-start gap-2',
        className
      )}
    >
      {Array.from({ length: roundsToShow }, (_, i) => i + 1).map((round) => (
        <RoundRecord
          key={round}
          round={round}
          score={roundScores[round - 1]}
          isWinner={roundWinners[round - 1] === player}
          side={side}
        />
      ))}
    </div>
  );
};

interface RoundRecordProps {
  round: number;
  score: number;
  isWinner: boolean;
  side?: 'red' | 'blue';
  className?: string;
}

export const RoundRecord = ({
  round,
  score,
  isWinner,
  side,
  className,
}: RoundRecordProps) => {
  const redWinIndicator = isWinner ? (
    <div className="relative size-full">
      <div
        className="size-full rounded-full bg-yellow-500"
        aria-label={`Red - Round ${round} win`}
      />
      <Ring className="rounded-full ring-3 dark:ring-white/20" />
    </div>
  ) : null;

  const blueWinIndicator = isWinner ? (
    <div className="relative size-full">
      <div
        className="size-full rounded-full bg-green-500"
        aria-label={`Blue - Round ${round} win`}
      />
      <Ring className="rounded-full ring-3 dark:ring-white/20" />
    </div>
  ) : null;

  const winIcon = side === 'blue' ? blueWinIndicator : redWinIndicator;

  return (
    <div
      className={cn(
        'flex h-13.5 w-full items-center justify-between text-5xl font-semibold text-white',
        className
      )}
    >
      <div className="min-w-14 text-left">R{round}</div>
      <div className="text-center">{score}</div>
      <div className="relative flex size-9 items-center justify-center">
        {winIcon}
      </div>
    </div>
  );
};

interface TotalWinsProps {
  wins: number;
  className?: string;
}

export const TotalWins = ({ wins, className }: TotalWinsProps) => {
  return (
    <div
      className={cn(
        'absolute top-[90%] left-1/2 m-auto h-20 -translate-x-1/2 -translate-y-1/2 text-center text-7xl font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]',
        className
      )}
    >
      {wins}
    </div>
  );
};
