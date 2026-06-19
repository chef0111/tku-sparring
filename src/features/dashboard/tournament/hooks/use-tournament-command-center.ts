import { useMemo } from 'react';
import { computeCommandCenter } from '../lib/compute-command-center';
import type { MatchData, TournamentData } from '@/features/dashboard/types';

export function useTournamentCommandCenter(input: {
  tournament: TournamentData | undefined;
  matches: Array<MatchData>;
}) {
  return useMemo(() => {
    if (!input.tournament) {
      return { setupSteps: [] };
    }

    return computeCommandCenter({
      tournament: input.tournament,
      matches: input.matches,
    });
  }, [input.tournament, input.matches]);
}
