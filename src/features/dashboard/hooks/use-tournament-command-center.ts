import { useMemo } from 'react';
import type { MatchData, TournamentData } from '@/features/dashboard/types';
import { computeCommandCenter } from '@/features/dashboard/lib/tournament/compute-command-center';

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
