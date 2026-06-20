import type { MatchData } from '@/contracts/tournament/match';
import type { TournamentData } from '@/contracts/tournament/list';

export interface SetupStep {
  id: 'athletes' | 'divisions' | 'brackets';
  label: string;
  description: string;
  complete: boolean;
  metric: string;
  builderTab: 'divisions' | 'brackets';
  ctaLabel: string;
}

function getAthletesMetric(athleteCount: number) {
  if (athleteCount === 0) return 'Pool empty';
  return `${athleteCount} ${athleteCount === 1 ? 'athlete' : 'athletes'} registered`;
}

function getDivisionsMetric(tournament: TournamentData) {
  const divisionCount = tournament._count.divisions;
  const athleteCount = tournament._count.tournamentAthletes;

  if (divisionCount === 0) return 'No divisions yet';

  const assigned = tournament.divisions.reduce(
    (sum, division) => sum + division._count.tournamentAthletes,
    0
  );

  if (athleteCount === 0) {
    return `${divisionCount} empty ${divisionCount === 1 ? 'division' : 'divisions'}`;
  }

  if (assigned < athleteCount) {
    return `${assigned} of ${athleteCount} athletes placed`;
  }

  return `${divisionCount} ${divisionCount === 1 ? 'division' : 'divisions'} · all placed`;
}

function getBracketsMetric(
  tournament: TournamentData,
  matches: Array<MatchData>
) {
  const divisionCount = tournament._count.divisions;

  if (divisionCount === 0) return 'Create divisions first';

  const divisionsWithBrackets = new Set(
    matches
      .filter((match) => match.kind === 'bracket')
      .map((match) => match.divisionId)
  ).size;

  if (divisionsWithBrackets === 0) return 'Not generated yet';

  if (divisionsWithBrackets === divisionCount) {
    return `${divisionCount} ${divisionCount === 1 ? 'division' : 'divisions'} bracketed`;
  }

  return `${divisionsWithBrackets} of ${divisionCount} divisions bracketed`;
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
            builderTab: 'divisions',
            ctaLabel: 'Add athletes',
          },
          {
            id: 'divisions',
            label: 'Divisions created',
            description:
              'Define weight and age divisions, then assign athletes from the pool.',
            complete: tournament._count.divisions > 0,
            metric: getDivisionsMetric(tournament),
            builderTab: 'divisions',
            ctaLabel: 'Manage divisions',
          },
          {
            id: 'brackets',
            label: 'Brackets generated',
            description:
              'Generate match shells in each division so arenas can schedule bouts.',
            complete: matches.some((match) => match.kind === 'bracket'),
            metric: getBracketsMetric(tournament, matches),
            builderTab: 'brackets',
            ctaLabel: 'Open brackets',
          },
        ]
      : [];

  return { setupSteps };
}
