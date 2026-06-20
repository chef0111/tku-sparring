import type { MatchData } from '@/contracts/tournament/match';
import type { ArenaRound0BracketMeta } from '@/lib/tournament/match-eligibility';
import { isArenaSequenceEligible } from '@/lib/tournament/match-eligibility';

export interface BracketActionQueueItem {
  match: MatchData;
  reasons: Array<string>;
}

export interface BuildBracketActionQueueOptions {
  groupAthleteCount?: number;
}

const STATUS_LABEL: Record<MatchData['status'], string> = {
  pending: 'Pending',
  active: 'Active',
  complete: 'Complete',
};

function queueReasonLines(m: MatchData): Array<string> {
  const status = STATUS_LABEL[m.status] ?? m.status;
  if (m.kind === 'custom') {
    return ['Custom match', status];
  }
  return [status];
}

/** Same meta shape as {@link buildMatchNumber} uses per group (single-group queue). */
function buildSingleGroupBracketMeta(
  matches: ReadonlyArray<MatchData>,
  athleteCount: number
): ReadonlyMap<string, ArenaRound0BracketMeta> | undefined {
  const gid = matches[0]?.divisionId;
  if (!gid || athleteCount < 1) return undefined;
  const round0 = matches.filter(
    (x) => x.divisionId === gid && x.kind !== 'custom' && x.round === 0
  );
  const ta = new Set<string>();
  for (const x of round0) {
    if (x.redTournamentAthleteId) ta.add(x.redTournamentAthleteId);
    if (x.blueTournamentAthleteId) ta.add(x.blueTournamentAthleteId);
  }
  return new Map([
    [
      gid,
      {
        athleteCount,
        round0MatchCount: round0.length,
        round0AthleteCount: ta.size,
      },
    ],
  ]);
}

export function buildBracketActionQueue(
  matches: Array<MatchData>,
  options?: BuildBracketActionQueueOptions
): Array<BracketActionQueueItem> {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort((a, b) => {
    const ac = a.kind === 'custom' ? 0 : 1;
    const bc = b.kind === 'custom' ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return a.round - b.round || a.matchIndex - b.matchIndex;
  });
  const out: Array<BracketActionQueueItem> = [];

  const divisionMeta =
    options?.groupAthleteCount != null && options.groupAthleteCount >= 1
      ? buildSingleGroupBracketMeta(sorted, options.groupAthleteCount)
      : undefined;

  for (const m of sorted) {
    const emptyRed = m.redTournamentAthleteId == null;
    const emptyBlue = m.blueTournamentAthleteId == null;
    if (emptyRed && emptyBlue) continue;

    if (
      m.kind !== 'custom' &&
      isArenaSequenceEligible(m, divisionMeta, sorted)
    ) {
      continue;
    }

    out.push({ match: m, reasons: queueReasonLines(m) });
  }

  return out;
}

/** Same count as the builder Matches panel ({@link buildBracketActionQueue}). */
export function countActionableMatches(
  matches: ReadonlyArray<MatchData>,
  options?: BuildBracketActionQueueOptions
): number {
  return buildBracketActionQueue([...matches], options).length;
}

export interface ActionableMatchGroupInput {
  id: string;
  _count: { tournamentAthletes: number };
}

function indexMatchesByGroupId(matches: ReadonlyArray<MatchData>) {
  const matchesByGroupId = new Map<string, Array<MatchData>>();

  for (const match of matches) {
    const groupMatches = matchesByGroupId.get(match.divisionId);
    if (groupMatches) {
      groupMatches.push(match);
    } else {
      matchesByGroupId.set(match.divisionId, [match]);
    }
  }

  return matchesByGroupId;
}

export function countActionableMatchesByGroupId(
  divisions: ReadonlyArray<ActionableMatchGroupInput>,
  matches: ReadonlyArray<MatchData>
) {
  const matchesByGroupId = indexMatchesByGroupId(matches);

  return new Map(
    divisions.map((group) => [
      group.id,
      countActionableMatches(matchesByGroupId.get(group.id) ?? [], {
        groupAthleteCount: group._count.tournamentAthletes,
      }),
    ])
  );
}

export function countActionableMatchesForGroups(
  divisions: ReadonlyArray<ActionableMatchGroupInput>,
  matches: ReadonlyArray<MatchData>
): number {
  const matchesByGroupId = indexMatchesByGroupId(matches);
  let total = 0;

  for (const group of divisions) {
    total += countActionableMatches(matchesByGroupId.get(group.id) ?? [], {
      groupAthleteCount: group._count.tournamentAthletes,
    });
  }

  return total;
}

export interface ActionableMatchTournamentGroupInput extends ActionableMatchGroupInput {
  tournamentId: string;
}

export function countActionableMatchesByTournamentId(
  divisions: ReadonlyArray<ActionableMatchTournamentGroupInput>,
  matches: ReadonlyArray<MatchData>
) {
  const groupsByTournamentId = new Map<
    string,
    Array<ActionableMatchGroupInput>
  >();
  const matchesByTournamentId = new Map<string, Array<MatchData>>();

  for (const group of divisions) {
    const tournamentGroups = groupsByTournamentId.get(group.tournamentId);
    if (tournamentGroups) {
      tournamentGroups.push(group);
    } else {
      groupsByTournamentId.set(group.tournamentId, [group]);
    }
  }

  for (const match of matches) {
    const tournamentMatches = matchesByTournamentId.get(match.tournamentId);
    if (tournamentMatches) {
      tournamentMatches.push(match);
    } else {
      matchesByTournamentId.set(match.tournamentId, [match]);
    }
  }

  const tournamentIds = new Set([
    ...groupsByTournamentId.keys(),
    ...matchesByTournamentId.keys(),
  ]);

  return new Map(
    [...tournamentIds].map((tournamentId) => [
      tournamentId,
      countActionableMatchesForGroups(
        groupsByTournamentId.get(tournamentId) ?? [],
        matchesByTournamentId.get(tournamentId) ?? []
      ),
    ])
  );
}
