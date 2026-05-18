import { useCallback } from 'react';
import { redoRound, replayMatch } from '@/stores/arena-scoring-actions';

export function useMatchReset() {
  const resetRound = useCallback(() => {
    redoRound();
  }, []);

  const resetMatch = useCallback(() => {
    replayMatch();
  }, []);

  return { resetRound, resetMatch };
}
