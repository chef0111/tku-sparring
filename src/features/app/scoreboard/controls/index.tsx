import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHotkeys } from 'react-hotkeys-hook';
import { Controller, ControllerContent, ScoreButtons } from './controller';
import { CriticalButtons, NormalButtons } from './score-button';
import { PenaltyBox } from './penalty-box';
import { PlayerLabel } from './player-label';
import type { HitType, Player } from '@/lib/scoreboard/hit-types';
import { keyboardMappings } from '@/lib/scoreboard/hit-types';
import { useTimerStore } from '@/stores/timer-store';
import { usePlayerStore } from '@/stores/player-store';
import { useSettings } from '@/contexts/settings';

interface ControlsProps {
  side: 'red' | 'blue';
  className?: string;
}

export const Controls = ({ side = 'red', className }: ControlsProps) => {
  const player: Player = side;

  const { isBreakTime, roundStarted, setRoundEnded } = useTimerStore(
    useShallow((s) => ({
      isBreakTime: s.isBreakTime,
      roundStarted: s.roundStarted,
      setRoundEnded: s.setRoundEnded,
    }))
  );

  const { playerName, fouls, recordHit, addPenalty, removePenalty } =
    usePlayerStore(
      useShallow((s) => ({
        playerName: s[player].name,
        fouls: s[player].fouls,
        recordHit: s.recordHit,
        addPenalty: s.addPenalty,
        removePenalty: s.removePenalty,
      }))
    );

  const { isOpen } = useSettings();

  const scoreActive = !isOpen && roundStarted && !isBreakTime;
  const canScoreHit = roundStarted && !isBreakTime;

  // Track active hit type for keyboard visual feedback
  const [activeHitType, setActiveHitType] = useState<HitType | null>(null);

  const handleHit = useCallback(
    (hitType: HitType) => {
      if (scoreActive) {
        const koOccurred = recordHit(player, hitType, canScoreHit, isBreakTime);

        if (koOccurred) {
          setRoundEnded(true);
        }
      }
    },
    [scoreActive, player, recordHit, canScoreHit, isBreakTime, setRoundEnded]
  );

  const handleAddFoul = useCallback(() => {
    if (!isBreakTime && roundStarted) {
      const disqualified = addPenalty(player);

      if (disqualified) {
        setRoundEnded(true);
      }
    }
  }, [isBreakTime, roundStarted, player, addPenalty, setRoundEnded]);

  const handleRemoveFoul = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isBreakTime) {
        removePenalty(player);
      }
    },
    [isBreakTime, player, removePenalty]
  );

  // Hit scoring keybinds
  const keys = Object.keys(keyboardMappings[player]);
  useHotkeys(
    keys.join(','),
    (e) => {
      if (!scoreActive) return;

      const key = e.key.toLowerCase();
      const hitType = keyboardMappings[player][key];

      if (hitType) {
        e.preventDefault();
        setActiveHitType(hitType);
        const koOccurred = recordHit(player, hitType, canScoreHit, isBreakTime);

        if (koOccurred) {
          setRoundEnded(true);
        }

        setTimeout(() => setActiveHitType(null), 100);
      }
    },
    [
      isOpen,
      scoreActive,
      player,
      recordHit,
      canScoreHit,
      isBreakTime,
      setRoundEnded,
    ]
  );

  const foulKey = player === 'red' ? 'w' : 'i';
  useHotkeys(
    foulKey,
    (e) => {
      if (isOpen) return;

      if (!isBreakTime) {
        e.preventDefault();
        const disqualified = addPenalty(player);

        if (disqualified) {
          setRoundEnded(true);
        }
      }
    },
    [isOpen, isBreakTime, player, addPenalty, setRoundEnded]
  );

  return (
    <Controller className={className}>
      <ControllerContent side={side}>
        <PlayerLabel className="text-4xl max-xl:text-3xl">
          {playerName}
        </PlayerLabel>
        <ScoreButtons side={side}>
          <CriticalButtons
            player={player}
            onHit={handleHit}
            disabled={!scoreActive}
            activeHitType={activeHitType}
          />
          <NormalButtons
            player={player}
            onHit={handleHit}
            disabled={!scoreActive}
            activeHitType={activeHitType}
          />
        </ScoreButtons>
      </ControllerContent>
      <PenaltyBox
        fouls={fouls}
        side={side}
        onClick={handleAddFoul}
        onContextMenu={handleRemoveFoul}
        disabled={!roundStarted}
      />
    </Controller>
  );
};

export { Controller, ControllerContent, ScoreButtons } from './controller';
export { CriticalButtons, NormalButtons } from './score-button';
export { PenaltyBox, Penalty } from './penalty-box';
export { PlayerLabel } from './player-label';
