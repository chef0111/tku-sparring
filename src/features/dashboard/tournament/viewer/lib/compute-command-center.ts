import type {
  GroupData,
  MatchData,
  MatchStatus,
  TournamentData,
} from '@/features/dashboard/types';

export interface GroupProgressRow {
  groupId: string;
  groupName: string;
  arenaIndex: number;
  athleteCount: number;
  matchCount: number;
  pending: number;
  active: number;
  complete: number;
  total: number;
}

export interface SetupStep {
  id: 'athletes' | 'groups' | 'brackets';
  label: string;
  complete: boolean;
}

export interface MatchTotals {
  pending: number;
  active: number;
  complete: number;
  total: number;
}

function countByStatus(matches: Array<MatchData>, status: MatchStatus) {
  return matches.filter((m) => m.status === status).length;
}

export function computeCommandCenter(input: {
  tournament: TournamentData;
  groups: Array<GroupData>;
  matches: Array<MatchData>;
}) {
  const { tournament, groups, matches } = input;

  const matchesByGroup = new Map<string, Array<MatchData>>();
  for (const m of matches) {
    const list = matchesByGroup.get(m.groupId) ?? [];
    list.push(m);
    matchesByGroup.set(m.groupId, list);
  }

  const groupProgress: Array<GroupProgressRow> = groups.map((g) => {
    const gm = matchesByGroup.get(g.id) ?? [];
    return {
      groupId: g.id,
      groupName: g.name,
      arenaIndex: g.arenaIndex,
      athleteCount: g._count.tournamentAthletes,
      matchCount: g._count.matches,
      pending: countByStatus(gm, 'pending'),
      active: countByStatus(gm, 'active'),
      complete: countByStatus(gm, 'complete'),
      total: gm.length,
    };
  });

  const matchTotals: MatchTotals = {
    pending: countByStatus(matches, 'pending'),
    active: countByStatus(matches, 'active'),
    complete: countByStatus(matches, 'complete'),
    total: matches.length,
  };

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

  return { groupProgress, matchTotals, setupSteps };
}
