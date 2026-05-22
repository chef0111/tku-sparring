import { useMemo } from 'react';
import { computeCommandCenter } from '../lib/compute-command-center';
import type {
  GroupData,
  MatchData,
  TournamentData,
} from '@/features/dashboard/types';

export function useTournamentCommandCenter(input: {
  tournament: TournamentData;
  groups: Array<GroupData>;
  matches: Array<MatchData>;
}) {
  return useMemo(
    () => computeCommandCenter(input),
    [input.tournament, input.groups, input.matches]
  );
}
