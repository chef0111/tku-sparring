import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMatchStore } from '@/stores/match-store';

export const useMatchResult = () => {
  const { redWon, blueWon, isMatchOver, matchWinner } = useMatchStore(
    useShallow((s) => ({
      redWon: s.redWon,
      blueWon: s.blueWon,
      isMatchOver: s.isMatchOver,
      matchWinner: s.matchWinner,
    }))
  );

  const setMatchOver = useMatchStore((s) => s.setMatchOver);
  const closeMatchResult = useMatchStore((s) => s.closeMatchResult);

  const prevRedWon = useRef(redWon);
  const prevBlueWon = useRef(blueWon);

  useEffect(() => {
    const redJustWonMatch = redWon === 2 && prevRedWon.current < 2;
    const blueJustWonMatch = blueWon === 2 && prevBlueWon.current < 2;

    if (redJustWonMatch) {
      setTimeout(() => {
        setMatchOver('red');
      }, 3000);
    } else if (blueJustWonMatch) {
      setTimeout(() => {
        setMatchOver('blue');
      }, 3000);
    }

    prevRedWon.current = redWon;
    prevBlueWon.current = blueWon;
  }, [redWon, blueWon, setMatchOver]);

  const handleCloseDialog = useCallback(() => {
    closeMatchResult();
  }, [closeMatchResult]);

  return {
    isMatchOver,
    matchWinner,
    redWon,
    blueWon,
    onClose: handleCloseDialog,
  };
};
