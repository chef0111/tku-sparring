import type { MatchData, TournamentData } from '@/features/dashboard/types';

export interface SetupStep {
  id: 'athletes' | 'groups' | 'brackets';
  label: string;
  complete: boolean;
}

export function computeCommandCenter(input: {
  tournament: TournamentData;
  matches: Array<MatchData>;
}) {
  const { tournament, matches } = input;

  const setupSteps: Array<SetupStep> =
    tournament.status === 'draft'
      ? [
          {
            id: 'athletes',
            label: 'Athletes added',
            complete: tournament._count.tournamentAthletes > 0,
          },
          {
            id: 'groups',
            label: 'Groups created',
            complete: tournament._count.groups > 0,
          },
          {
            id: 'brackets',
            label: 'Brackets generated',
            complete: matches.some((m) => m.kind === 'bracket'),
          },
        ]
      : [];

  return { setupSteps };
}
