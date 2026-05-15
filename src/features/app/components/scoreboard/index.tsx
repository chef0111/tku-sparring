import { useHotkeys } from 'react-hotkeys-hook';
import { Timer } from './timer';
import { ScoreBox } from './score-box';
import { Controls } from './controls';
import type { TemporalState } from 'zundo';
import type { StoreApi } from 'zustand';
import type { PlayerStore } from '@/stores/player-store';
import { usePlayerStore } from '@/stores/player-store';
import { useMatchStore } from '@/stores/match-store';
import { useTimerStore } from '@/stores/timer-store';
import { useSettings } from '@/contexts/settings';
import { cn } from '@/lib/utils';

interface ScoreboardProps {
  className?: string;
}

export const Scoreboard = ({ className }: ScoreboardProps) => {
  const { isOpen } = useSettings();

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
      useTimerStore.getState().reset();
      usePlayerStore.getState().resetRoundCombatPreserveHealth();
    },
    { preventDefault: true },
    [isOpen]
  );

  useHotkeys(
    'mod+m',
    (e) => {
      e.preventDefault();
      if (isOpen) return;
      useMatchStore.getState().closeMatchResult();
      useMatchStore.getState().resetMatch();
      useTimerStore.getState().reset();
      usePlayerStore.getState().resetMatchCombatPreservePlayers();
    },
    [isOpen]
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

// Re-export sub-components for flexibility
export { Timer } from './timer';
export { ScoreBox } from './score-box';
export { Controls } from './controls';
