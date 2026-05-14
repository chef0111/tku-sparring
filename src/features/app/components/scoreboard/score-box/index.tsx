import { Activity } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { HitIcon } from './hit-icon';
import { Record, TotalWins } from './record';
import { StatsCard } from './stats';
import type { HitType } from '@/lib/scoreboard/hit-types';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/player-store';
import { useMatchStore } from '@/stores/match-store';
import { useTimerStore } from '@/stores/timer-store';
import { Card } from '@/components/ui/card';

interface ScoreBoxProps {
  side?: 'red' | 'blue';
  className?: string;
}

export const ScoreBox = ({ side = 'red', className }: ScoreBoxProps) => {
  const player: Player = side;

  const { roundScores, hits } = usePlayerStore(
    useShallow((s) => ({
      roundScores: s[player].roundScores,
      hits: s[player].hits,
    }))
  );

  const lastHit = usePlayerStore((s) =>
    player === 'red' ? s.lastRedHit : s.lastBlueHit
  );

  const { roundWinners, redWon, blueWon, currentRound } = useMatchStore(
    useShallow((s) => ({
      roundWinners: s.roundWinners,
      redWon: s.redWon,
      blueWon: s.blueWon,
      currentRound: s.currentRound,
    }))
  );

  const isBreakTime = useTimerStore((s) => s.isBreakTime);

  const wins = side === 'blue' ? blueWon : redWon;

  return (
    <ScoreboxGroup className={className}>
      <ScoreboxContent
        side={side}
        className={cn(isBreakTime ? 'justify-between' : 'justify-center')}
      >
        <Activity mode={isBreakTime ? 'visible' : 'hidden'}>
          <Record
            roundScores={roundScores}
            roundWinners={roundWinners}
            player={player}
            side={side}
            currentRound={currentRound}
            isBreakTime={isBreakTime}
          />
        </Activity>

        {!isBreakTime && (
          <DamageScore
            player={player}
            hitType={lastHit?.hitType ?? null}
            timestamp={lastHit?.timestamp ?? 0}
          />
        )}

        <Activity mode={isBreakTime ? 'visible' : 'hidden'}>
          <TotalWins wins={wins} />
        </Activity>
      </ScoreboxContent>
      <StatsCard hits={hits} wins={wins} side={side} />
    </ScoreboxGroup>
  );
};

interface ScoreboxGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ScoreboxGroup = ({ children, className }: ScoreboxGroupProps) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-[27vw] flex-col items-center justify-between',
        className
      )}
    >
      {children}
    </div>
  );
};

interface ScoreboxContentProps {
  children: React.ReactNode;
  side: 'red' | 'blue';
  className?: string;
}

export const ScoreboxContent = ({
  children,
  side,
  className,
}: ScoreboxContentProps) => {
  return (
    <Card
      className={cn(
        'relative flex h-full w-full grow flex-col items-center overflow-hidden rounded-none p-5',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-br before:from-white/10 before:to-transparent',
        'after:pointer-events-none after:absolute after:top-[-50%] after:left-[-50%] after:h-[200%] after:w-[200%] after:rotate-30 after:bg-white/10',
        side === 'blue'
          ? 'bg-linear-to-bl from-[#01559a] via-[#0070c0] to-[#0070c0] shadow-[inset_-5px_-5px_15px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(0,0,0,0.3),0_5px_15px_rgba(0,112,192,0.4)]'
          : 'bg-linear-to-br from-[#bf0000] via-[#ff0000] to-[#ff0000] shadow-[inset_5px_-5px_15px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(0,0,0,0.3),0_5px_15px_rgba(255,0,0,0.4)]',
        className
      )}
    >
      {children}
    </Card>
  );
};

interface DamageScoreProps {
  player: Player;
  hitType: HitType | null;
  timestamp: number;
  className?: string;
}

export const DamageScore = ({
  player,
  hitType,
  timestamp,
  className,
}: DamageScoreProps) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center rounded-full border-none',
        className
      )}
    >
      <HitIcon
        player={player}
        hitType={hitType}
        timestamp={timestamp}
        className="max-h-full max-w-full"
      />
    </div>
  );
};

export { Record, RoundRecord, TotalWins } from './record';
export { StatsCard, StatItem } from './stats';
export { HitIcon } from './hit-icon';
