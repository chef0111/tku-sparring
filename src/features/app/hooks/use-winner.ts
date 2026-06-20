import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { PlayerData } from '@/features/app/stores/player-store';
import { usePlayerStore } from '@/features/app/stores/player-store';
import { useMatchStore } from '@/features/app/stores/match-store';
import { useTimerStore } from '@/features/app/stores/timer-store';

type WinResult = Player | 'tie';

export const useDeclareWinner = () => {
  const {
    redHealth,
    redMana,
    redFouls,
    redTechnique,
    redHeadHits,
    blueHealth,
    blueMana,
    blueFouls,
    blueTechnique,
    blueHeadHits,
    saveRoundScores,
    resetRoundStats,
  } = usePlayerStore(
    useShallow((s) => ({
      redHealth: s.red.health,
      redMana: s.red.mana,
      redFouls: s.red.fouls,
      redTechnique: s.red.technique,
      redHeadHits: s.red.headHits,
      blueHealth: s.blue.health,
      blueMana: s.blue.mana,
      blueFouls: s.blue.fouls,
      blueTechnique: s.blue.technique,
      blueHeadHits: s.blue.headHits,
      saveRoundScores: s.saveRoundScores,
      resetRoundStats: s.resetRoundStats,
    }))
  );

  const { roundStarted, isBreakTime, isRunning, startBreak, setRoundEnded } =
    useTimerStore(
      useShallow((s) => ({
        roundStarted: s.roundStarted,
        isBreakTime: s.isBreakTime,
        isRunning: s.isRunning,
        startBreak: s.startBreak,
        setRoundEnded: s.setRoundEnded,
      }))
    );

  const {
    currentRound,
    recordRoundWinner,
    declareWinner: getWinner,
  } = useMatchStore(
    useShallow((s) => ({
      currentRound: s.currentRound,
      recordRoundWinner: s.recordRoundWinner,
      declareWinner: s.declareWinner,
    }))
  );

  const determineWinner = useCallback((): WinResult => {
    const red = {
      health: redHealth,
      mana: redMana,
      fouls: redFouls,
      technique: redTechnique,
      headHits: redHeadHits,
    };

    const blue = {
      health: blueHealth,
      mana: blueMana,
      fouls: blueFouls,
      technique: blueTechnique,
      headHits: blueHeadHits,
    };

    return getWinner(red as PlayerData, blue as PlayerData);
  }, [
    redHealth,
    redMana,
    redFouls,
    redTechnique,
    redHeadHits,
    blueHealth,
    blueMana,
    blueFouls,
    blueTechnique,
    blueHeadHits,
    getWinner,
  ]);

  const declareWinner = useCallback(() => {
    if (isBreakTime || isRunning || !roundStarted) return;

    const winner = determineWinner();
    saveRoundScores(currentRound - 1);

    if (winner !== 'tie') {
      recordRoundWinner(winner);
    }

    setRoundEnded(true);
    resetRoundStats();
    startBreak();
  }, [
    isBreakTime,
    isRunning,
    roundStarted,
    currentRound,
    determineWinner,
    saveRoundScores,
    recordRoundWinner,
    setRoundEnded,
    resetRoundStats,
    startBreak,
  ]);

  const forceWinner = useCallback(
    (player: Player) => {
      if (isBreakTime || isRunning || !roundStarted) return;

      saveRoundScores(currentRound - 1);
      recordRoundWinner(player);
      setRoundEnded(true);
      resetRoundStats();
      startBreak();
    },
    [
      isBreakTime,
      isRunning,
      roundStarted,
      currentRound,
      saveRoundScores,
      recordRoundWinner,
      setRoundEnded,
      resetRoundStats,
      startBreak,
    ]
  );

  return {
    determineWinner,
    declareWinner,
    forceWinner,
  };
};
