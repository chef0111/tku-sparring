import { useHotkeys } from 'react-hotkeys-hook';
import { Timer } from './timer';
import { ScoreBox } from './score-box';
import { Controls } from './controls';
import type { TemporalState } from 'zundo';
import type { StoreApi } from 'zustand';
import type { PlayerStore } from '@/features/app/stores/player-store';
import { useMatchReset } from '@/features/app/hooks/use-match-reset';
import { usePlayerStore } from '@/features/app/stores/player-store';
import { useSettings } from '@/features/app/contexts/settings';
import { cn } from '@/lib/utils';

interface ScoreboardProps {
  className?: string;
}

export const Scoreboard = ({ className }: ScoreboardProps) => {
  const { isOpen } = useSettings();
  const { resetRound, resetMatch } = useMatchReset();

  useHotkeys(
    'mod+z',
    (e) => {
      e.preventDefault();
      if (isOpen) return;

      const temporal = (
        usePlayerStore as unknown as {
          temporal: StoreApi<TemporalState<PlayerStore>>;
        }
      ).temporal;
      if (temporal) {
        temporal.getState().undo();
      }
    },
    [isOpen]
  );

  useHotkeys(
    'mod+r',
    (e) => {
      e.preventDefault();
      if (isOpen) return;
      resetRound();
    },
    { preventDefault: true },
    [isOpen, resetRound]
  );

  useHotkeys(
    'mod+m',
    (e) => {
      e.preventDefault();
      if (isOpen) return;
      resetMatch();
    },
    { preventDefault: true },
    [isOpen, resetMatch]
  );

  return (
    <section
      className={cn(
        'relative flex h-[calc(100%-14vh-5rem)] max-w-full grow flex-row items-center justify-center',
        className
      )}
    >
      {/* Red player side */}
      <Controls side="red" />
      <ScoreBox side="red" />

      <Timer />

      {/* Blue player side */}
      <ScoreBox side="blue" />
      <Controls side="blue" />
    </section>
  );
};
