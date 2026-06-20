import { useMemo } from 'react';
import type { MatchData } from '@/contracts/tournament/match';
import type { TournamentData } from '@/contracts/tournament/list';
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
