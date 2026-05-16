import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { useSettings } from '@/contexts/settings';
import { useMatchStore } from '@/stores/match-store';

export function useRoundSubmit() {
  const { mutateAsync } = useArenaMutation();
  const { formData } = useSettings();
  const advanceMatch = formData.advance.match;

  const { redWon, blueWon, hydrationGeneration } = useMatchStore(
    useShallow((s) => ({
      redWon: s.redWon,
      blueWon: s.blueWon,
      hydrationGeneration: s.hydrationGeneration,
    }))
  );

  const prevRed = React.useRef(redWon);
  const prevBlue = React.useRef(blueWon);
  const hydrated = React.useRef(false);
  const prevAdvanceMatch = React.useRef<string | null>(advanceMatch);
  const prevHydrationGen = React.useRef(hydrationGeneration);

  React.useEffect(() => {
    if (!advanceMatch) {
      prevRed.current = redWon;
      prevBlue.current = blueWon;
      hydrated.current = false;
      prevAdvanceMatch.current = null;
      return;
    }

    if (advanceMatch !== prevAdvanceMatch.current) {
      prevAdvanceMatch.current = advanceMatch;
      prevRed.current = redWon;
      prevBlue.current = blueWon;
      hydrated.current = false;
    }

    if (hydrationGeneration !== prevHydrationGen.current) {
      prevHydrationGen.current = hydrationGeneration;
      prevRed.current = redWon;
      prevBlue.current = blueWon;
      hydrated.current = true;
      return;
    }

    if (!hydrated.current) {
      hydrated.current = true;
      prevRed.current = redWon;
      prevBlue.current = blueWon;
      return;
    }

    const redUp = redWon > prevRed.current;
    const blueUp = blueWon > prevBlue.current;

    if ((redUp && !blueUp) || (!redUp && blueUp)) {
      void mutateAsync({
        kind: 'match.updateScore',
        payload: {
          matchId: advanceMatch,
          redWins: redWon,
          blueWins: blueWon,
        },
      });
    }

    prevRed.current = redWon;
    prevBlue.current = blueWon;
  }, [advanceMatch, blueWon, hydrationGeneration, mutateAsync, redWon]);
}
