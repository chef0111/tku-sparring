import type { MatchData } from '@/features/dashboard/types';

/** Round-0 athlete vs empty slot: no shared arena display number (advanced row). */
export function excludedFromArenaDisplaySequence(match: MatchData): boolean {
  if (match.round !== 0) return false;
  const hasRed = match.redTournamentAthleteId != null;
  const hasBlue = match.blueTournamentAthleteId != null;
  return hasRed !== hasBlue;
}

/** Public bracket header: `Match {n}` or **Advanced** when this row has no arena number. */
export function formatArenaMatchHeaderLine(
  displayNumber: number | null | undefined
): string {
  return displayNumber != null ? `Match ${displayNumber}` : 'Advanced';
}

/**
 * Placeholder for an upper-round slot fed by a completed or pending feeder.
 * When the feeder has no arena number (advanced), prefer the winner's name if known.
 */
export function formatFeederWinnerPlaceholder(
  feeder: MatchData,
  arenaNumberById: ReadonlyMap<string, number | null>,
  resolveAthleteName?: (
    tournamentAthleteId: string
  ) => string | null | undefined
): string {
  const n = arenaNumberById.get(feeder.id);
  if (n != null) return formatFeederWinnerLabel(n);
  if (
    feeder.status === 'complete' &&
    feeder.winnerTournamentAthleteId &&
    resolveAthleteName
  ) {
    const name = resolveAthleteName(feeder.winnerTournamentAthleteId);
    if (name) return name;
  }
  return 'Advanced';
}

/**
 * Order matches in a single `(group, round)` bucket: `matchIndex` ascending,
 * except when `thirdPlaceMatch` and this is that group's max round with two matches
 * (third-place before final).
 */
export function sortMatchesInRoundForGroup(
  roundMatches: Array<MatchData>,
  thirdPlaceMatch: boolean,
  groupMaxRound: number,
  round: number
): Array<MatchData> {
  let arr = [...roundMatches].sort((a, b) => a.matchIndex - b.matchIndex);
  if (thirdPlaceMatch && round === groupMaxRound && arr.length === 2) {
    arr = [...arr].sort((a, b) => b.matchIndex - a.matchIndex);
  }
  return arr;
}

/**
 * Arena display numbers follow `docs/bracket-generation.md`:
 * `arenaIndex * 100 + 1-based sequence` within the group (e.g. Arena 1 → Match 101, 102, …).
 * When third-place is enabled, the third-place match is numbered immediately before the final.
 */
export function sortMatchesForArenaSequence(
  matches: Array<MatchData>,
  thirdPlaceMatch: boolean
): Array<MatchData> {
  if (matches.length === 0) return [];
  const maxRound = Math.max(...matches.map((m) => m.round));
  const roundNums = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const result: Array<MatchData> = [];
  for (const round of roundNums) {
    const roundMatches = matches.filter((m) => m.round === round);
    result.push(
      ...sortMatchesInRoundForGroup(
        roundMatches,
        thirdPlaceMatch,
        maxRound,
        round
      )
    );
  }
  return result;
}

export type ArenaGroupMeta = { id: string; thirdPlaceMatch: boolean };

export type ArenaCrossGroupOrderInput = {
  arenaIndex: number;
  groups: ReadonlyArray<ArenaGroupMeta>;
  matches: ReadonlyArray<MatchData>;
  /** groupIds in “who goes first within each round” order for this arena. */
  groupOrder: ReadonlyArray<string>;
  /** Optional: lower runs earlier within same `(round, group)` bucket. */
  manualRankByMatchId?: ReadonlyMap<string, number>;
};

/** Merge saved order with any new groups on the same arena (stable append). */
export function resolveArenaGroupOrder(
  groupsOnArena: ReadonlyArray<{ id: string }>,
  saved: ReadonlyArray<string> | null | undefined
): Array<string> {
  const ids = new Set(groupsOnArena.map((g) => g.id));
  const out: Array<string> = [];
  if (saved) {
    for (const id of saved) {
      if (ids.has(id)) out.push(id);
    }
  }
  for (const g of groupsOnArena) {
    if (!out.includes(g.id)) out.push(g.id);
  }
  return out;
}

export function buildManualRankMapFromMatches(
  matches: ReadonlyArray<MatchData>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of matches) {
    if (x.arenaSequenceRank != null) m.set(x.id, x.arenaSequenceRank);
  }
  return m;
}

/**
 * One shared `k` for all groups on the same arena: round-major, then `groupOrder`,
 * then optional manual rank within `(round, group)`.
 * Every match in `input.matches` gets a map entry: `number` or `null` when excluded
 * ({@link excludedFromArenaDisplaySequence}).
 */
export function buildSharedArenaMatchNumberById(
  input: ArenaCrossGroupOrderInput
): Map<string, number | null> {
  const safeArena = Math.max(1, input.arenaIndex);
  const base = safeArena * 100;
  const groupMeta = new Map(input.groups.map((g) => [g.id, g]));
  const groupMaxRound = new Map<string, number>();
  for (const gid of input.groupOrder) {
    const gm = input.matches.filter((m) => m.groupId === gid);
    groupMaxRound.set(
      gid,
      gm.length === 0 ? 0 : Math.max(...gm.map((m) => m.round))
    );
  }

  const rounds = [...new Set(input.matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const ordered: Array<MatchData> = [];

  for (const round of rounds) {
    for (const gid of input.groupOrder) {
      const meta = groupMeta.get(gid);
      if (!meta) continue;
      const roundMatches = input.matches.filter(
        (m) => m.groupId === gid && m.round === round
      );
      if (roundMatches.length === 0) continue;
      const maxR = groupMaxRound.get(gid) ?? 0;
      const bracketSorted = sortMatchesInRoundForGroup(
        roundMatches,
        meta.thirdPlaceMatch,
        maxR,
        round
      );
      const idx = new Map(bracketSorted.map((m, i) => [m.id, i]));
      const sorted = [...bracketSorted].sort((a, b) => {
        const ra = input.manualRankByMatchId?.get(a.id);
        const rb = input.manualRankByMatchId?.get(b.id);
        if (ra !== undefined || rb !== undefined) {
          const ca = ra ?? 1_000_000;
          const cb = rb ?? 1_000_000;
          if (ca !== cb) return ca - cb;
        }
        return (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0);
      });
      ordered.push(...sorted);
    }
  }

  const map = new Map<string, number | null>();
  let seq = 0;
  for (const m of ordered) {
    if (excludedFromArenaDisplaySequence(m)) {
      map.set(m.id, null);
    } else {
      seq += 1;
      map.set(m.id, base + seq);
    }
  }
  for (const m of input.matches) {
    if (!map.has(m.id)) {
      map.set(m.id, null);
    }
  }
  return map;
}

export function buildArenaMatchNumberById(
  matches: Array<MatchData>,
  arenaIndex: number,
  thirdPlaceMatch: boolean
): Map<string, number | null> {
  const gid = matches[0]?.groupId;
  if (!gid) return new Map();
  return buildSharedArenaMatchNumberById({
    arenaIndex,
    groups: [{ id: gid, thirdPlaceMatch }],
    matches,
    groupOrder: [gid],
  });
}

export function formatArenaMatchTitle(displayNumber: number): string {
  return `Match ${displayNumber}`;
}

export function formatFeederWinnerLabel(displayNumber: number): string {
  return `Winner ${displayNumber}`;
}

export function getFeederMatch(
  matches: Array<MatchData>,
  round: number,
  matchIndex: number,
  side: 'red' | 'blue'
): MatchData | undefined {
  if (round <= 0) return undefined;
  const childIndex = side === 'red' ? matchIndex * 2 : matchIndex * 2 + 1;
  return matches.find(
    (m) => m.round === round - 1 && m.matchIndex === childIndex
  );
}
