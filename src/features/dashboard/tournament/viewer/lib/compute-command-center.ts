import type { MatchData, TournamentData } from '@/features/dashboard/types';

export interface SetupStep {
  id: 'athletes' | 'groups' | 'brackets';
  label: string;
  description: string;
  complete: boolean;
  metric: string;
  builderTab: 'groups' | 'brackets';
  ctaLabel: string;
}

function getAthletesMetric(athleteCount: number) {
  if (athleteCount === 0) return 'Pool empty';
  return `${athleteCount} ${athleteCount === 1 ? 'athlete' : 'athletes'} registered`;
}

function getGroupsMetric(tournament: TournamentData) {
  const groupCount = tournament._count.groups;
  const athleteCount = tournament._count.tournamentAthletes;

  if (groupCount === 0) return 'No divisions yet';

  const assigned = tournament.groups.reduce(
    (sum, group) => sum + group._count.tournamentAthletes,
    0
  );

  if (athleteCount === 0) {
    return `${groupCount} empty ${groupCount === 1 ? 'division' : 'divisions'}`;
  }

  if (assigned < athleteCount) {
    return `${assigned} of ${athleteCount} athletes placed`;
  }

  return `${groupCount} ${groupCount === 1 ? 'division' : 'divisions'} · all placed`;
}

function getBracketsMetric(
  tournament: TournamentData,
  matches: Array<MatchData>
) {
  const groupCount = tournament._count.groups;

  if (groupCount === 0) return 'Create groups first';

  const groupsWithBrackets = new Set(
    matches
      .filter((match) => match.kind === 'bracket')
      .map((match) => match.groupId)
  ).size;

  if (groupsWithBrackets === 0) return 'Not generated yet';

  if (groupsWithBrackets === groupCount) {
    return `${groupCount} ${groupCount === 1 ? 'group' : 'groups'} bracketed`;
  }

  return `${groupsWithBrackets} of ${groupCount} groups bracketed`;
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
            description:
              'Import or add competitors to the tournament pool before organizing divisions.',
            complete: tournament._count.tournamentAthletes > 0,
            metric: getAthletesMetric(tournament._count.tournamentAthletes),
            builderTab: 'groups',
            ctaLabel: 'Add athletes',
          },
          {
            id: 'groups',
            label: 'Groups created',
            description:
              'Define weight and age divisions, then assign athletes from the pool.',
            complete: tournament._count.groups > 0,
            metric: getGroupsMetric(tournament),
            builderTab: 'groups',
            ctaLabel: 'Manage groups',
          },
          {
            id: 'brackets',
            label: 'Brackets generated',
            description:
              'Generate match shells in each group so arenas can schedule bouts.',
            complete: matches.some((match) => match.kind === 'bracket'),
            metric: getBracketsMetric(tournament, matches),
            builderTab: 'brackets',
            ctaLabel: 'Open brackets',
          },
        ]
      : [];

  return { setupSteps };
}
