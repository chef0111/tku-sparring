import { useMemo } from 'react';
import { computeCommandCenter } from '../lib/compute-command-center';
import type { MatchData, TournamentData } from '@/features/dashboard/types';

export function useTournamentCommandCenter(input: {
  tournament: TournamentData;
  matches: Array<MatchData>;
}) {
  return useMemo(
    () => computeCommandCenter(input),
    [input.tournament, input.matches]
  );
}
