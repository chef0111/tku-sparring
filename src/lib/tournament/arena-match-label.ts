import { buildSlotMap } from './bracket-seeding';
import type { MatchData } from '@/features/dashboard/types';

export type ArenaRound0BracketMeta = {
  athleteCount: number;
  round0MatchCount: number;
  distinctRound0TournamentAthleteCount: number;
};

export function excludedFromArenaSequence(
  match: MatchData,
  groupBracketMeta?: ReadonlyMap<string, ArenaRound0BracketMeta>,
  allMatches?: ReadonlyArray<MatchData>
): boolean {
  if (match.kind === 'custom') return true;

  if (match.round === 0) {
    const hasRed = match.redTournamentAthleteId != null;
    const hasBlue = match.blueTournamentAthleteId != null;
    if (hasRed !== hasBlue) return true;

    if (!groupBracketMeta) return false;
    const meta = groupBracketMeta.get(match.groupId);
    if (!meta) return false;

    const {
      athleteCount: n,
      round0MatchCount,
      distinctRound0TournamentAthleteCount: k,
    } = meta;
    const bracketSize = round0MatchCount * 2;
    if (n < 1 || round0MatchCount < 1) return false;
    if (bracketSize < 2 || (bracketSize & (bracketSize - 1)) !== 0)
      return false;

    let slotMap: Array<number>;
    try {
      slotMap = buildSlotMap(bracketSize);
    } catch {
      return false;
    }

    const i = match.matchIndex * 2;
    const redSeed = slotMap[i]!;
    const blueSeed = slotMap[i + 1]!;
    if (redSeed > n && blueSeed > n) return true;
    if (!hasRed && !hasBlue && k >= n) return true;

    return false;
  }

  if (!allMatches || allMatches.length === 0) return false;

  const fr = getFeederMatch(allMatches, match.round, match.matchIndex, 'red');
  const fb = getFeederMatch(allMatches, match.round, match.matchIndex, 'blue');
  if (!fr || !fb) return false;

  const phantomRound0Feeder = (f: MatchData) =>
    f.round === 0 &&
    f.redTournamentAthleteId == null &&
    f.blueTournamentAthleteId == null;
  const er = phantomRound0Feeder(fr);
  const eb = phantomRound0Feeder(fb);
  if (er && eb) return false;
  return er !== eb;
}

export type MatchHeaderLineOptions = {
  /** Both slots lack a tournament athlete and this match has no arena number — omit "Advanced". */
  bothSlotsOpen?: boolean;
};

/** Bracket card header: `Match {n}`, **Advanced** when unnumbered but still a real pairing row, or empty for double-open phantoms. */
export function formatMatchHeaderLine(
  displayNumber: number | null | undefined,
  options?: MatchHeaderLineOptions
): string {
  if (displayNumber != null) return `Match ${displayNumber}`;
  if (options?.bothSlotsOpen) return '';
  return 'Advanced';
}

/**
 * Placeholder for an upper-round slot fed by a completed or pending feeder.
 * When the feeder has no arena number, prefer the winner's name if known; otherwise **Open**.
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
  return 'Open';
}

export function sortMatchesInRound(
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

export type ArenaGroupMeta = { id: string; thirdPlaceMatch: boolean };

export type ArenaCrossGroupOrderInput = {
  arenaIndex: number;
  groups: ReadonlyArray<ArenaGroupMeta>;
  matches: ReadonlyArray<MatchData>;
  /** groupIds in “who goes first within each round” order for this arena. */
  groupOrder: ReadonlyArray<string>;
  /** Optional: when set, round-0 BYE-vs-BYE rows are excluded from the arena sequence (see {@link excludedFromArenaSequence}). */
  groupAthleteCountById?: ReadonlyMap<string, number>;
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
 * ({@link excludedFromArenaSequence}, including upper rounds fed by a fully empty round-0 row).
 */
export function buildMatchNumber(
  input: ArenaCrossGroupOrderInput
): Map<string, number | null> {
  const safeArena = Math.max(1, input.arenaIndex);
  const base = safeArena * 100;
  const groupMeta = new Map(input.groups.map((g) => [g.id, g]));
  let groupBracketMeta: ReadonlyMap<string, ArenaRound0BracketMeta> | undefined;
  if (input.groupAthleteCountById && input.groupAthleteCountById.size > 0) {
    const round0CountByGroup = new Map<string, number>();
    const distinctTaByGroup = new Map<string, Set<string>>();
    for (const m of input.matches) {
      if (m.round !== 0) continue;
      round0CountByGroup.set(
        m.groupId,
        (round0CountByGroup.get(m.groupId) ?? 0) + 1
      );
      let taSet = distinctTaByGroup.get(m.groupId);
      if (!taSet) {
        taSet = new Set<string>();
        distinctTaByGroup.set(m.groupId, taSet);
      }
      if (m.redTournamentAthleteId) taSet.add(m.redTournamentAthleteId);
      if (m.blueTournamentAthleteId) taSet.add(m.blueTournamentAthleteId);
    }
    const meta = new Map<string, ArenaRound0BracketMeta>();
    for (const [gid, athleteCount] of input.groupAthleteCountById) {
      const round0MatchCount = round0CountByGroup.get(gid);
      if (round0MatchCount !== undefined) {
        meta.set(gid, {
          athleteCount,
          round0MatchCount,
          distinctRound0TournamentAthleteCount:
            distinctTaByGroup.get(gid)?.size ?? 0,
        });
      }
    }
    if (meta.size > 0) groupBracketMeta = meta;
  }
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
      const bracketSorted = sortMatchesInRound(
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
    if (excludedFromArenaSequence(m, groupBracketMeta, input.matches)) {
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
  thirdPlaceMatch: boolean,
  athleteCount?: number
): Map<string, number | null> {
  const gid = matches[0]?.groupId;
  if (!gid) return new Map();
  const groupAthleteCountById =
    athleteCount !== undefined
      ? new Map<string, number>([[gid, athleteCount]])
      : undefined;
  return buildMatchNumber({
    arenaIndex,
    groups: [{ id: gid, thirdPlaceMatch }],
    matches,
    groupOrder: [gid],
    groupAthleteCountById,
  });
}

export function formatArenaMatchTitle(displayNumber: number): string {
  return `Match ${displayNumber}`;
}

export function formatFeederWinnerLabel(displayNumber: number): string {
  return `Winner ${displayNumber}`;
}

export function getFeederMatch(
  matches: ReadonlyArray<MatchData>,
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
