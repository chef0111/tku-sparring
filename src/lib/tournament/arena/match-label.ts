import type { MatchData } from '@/contracts/tournament/match';
import type { ArenaRound0BracketMeta } from '@/lib/tournament/match-eligibility';
import { isArenaSequenceEligible } from '@/lib/tournament/match-eligibility';

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
    feeder.tournamentWinnerId &&
    resolveAthleteName
  ) {
    const name = resolveAthleteName(feeder.tournamentWinnerId);
    if (name) return name;
  }
  return 'Open';
}

export function sortMatchesInRound(
  roundMatches: Array<MatchData>,
  thirdPlaceMatch: boolean,
  divisionMaxRound: number,
  round: number
): Array<MatchData> {
  let arr = [...roundMatches].sort((a, b) => a.matchIndex - b.matchIndex);
  if (thirdPlaceMatch && round === divisionMaxRound && arr.length === 2) {
    arr = [...arr].sort((a, b) => b.matchIndex - a.matchIndex);
  }
  return arr;
}

export type ArenaDivisionMeta = { id: string; thirdPlaceMatch: boolean };

export type ArenaCrossDivisionOrderInput = {
  arenaIndex: number;
  divisions: ReadonlyArray<ArenaDivisionMeta>;
  matches: ReadonlyArray<MatchData>;
  /** divisionIds in “who goes first within each round” order for this arena. */
  divisionOrder: ReadonlyArray<string>;
  /** Optional: when set, round-0 BYE-vs-BYE rows are excluded from the arena sequence (see {@link isArenaSequenceEligible}). */
  divisionAthleteCountById?: ReadonlyMap<string, number>;
  /** Optional: lower runs earlier within same `(round, group)` bucket. */
  manualRankByMatchId?: ReadonlyMap<string, number>;
};

/** Merge saved order with any new groups on the same arena (stable append). */
export function resolveArenaDivisionOrder(
  divisionsOnArena: ReadonlyArray<{ id: string }>,
  saved: ReadonlyArray<string> | null | undefined
): Array<string> {
  const ids = new Set(divisionsOnArena.map((g) => g.id));
  const out: Array<string> = [];
  if (saved) {
    for (const id of saved) {
      if (ids.has(id)) out.push(id);
    }
  }
  for (const g of divisionsOnArena) {
    if (!out.includes(g.id)) out.push(g.id);
  }
  return out;
}

export function buildManualRankMap(
  matches: ReadonlyArray<MatchData>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of matches) {
    if (x.arenaSequenceRank != null) m.set(x.id, x.arenaSequenceRank);
  }
  return m;
}

/**
 * One shared `k` for all groups on the same arena: round-major, then `divisionOrder`,
 * then optional manual rank within `(round, group)`.
 * Every match in `input.matches` gets a map entry: `number` or `null` when excluded
 * ({@link isArenaSequenceEligible}, including upper rounds fed by a fully empty round-0 row).
 */
export function buildMatchNumber(
  input: ArenaCrossDivisionOrderInput
): Map<string, number | null> {
  const safeArena = Math.max(1, input.arenaIndex);
  const base = safeArena * 100;
  const divisionMeta = new Map(input.divisions.map((g) => [g.id, g]));
  let divisionBracketMeta:
    | ReadonlyMap<string, ArenaRound0BracketMeta>
    | undefined;
  if (
    input.divisionAthleteCountById &&
    input.divisionAthleteCountById.size > 0
  ) {
    const round0CountByDivision = new Map<string, number>();
    const distinctTaByDivision = new Map<string, Set<string>>();
    for (const m of input.matches) {
      if (m.round !== 0) continue;
      round0CountByDivision.set(
        m.divisionId,
        (round0CountByDivision.get(m.divisionId) ?? 0) + 1
      );
      let taSet = distinctTaByDivision.get(m.divisionId);
      if (!taSet) {
        taSet = new Set<string>();
        distinctTaByDivision.set(m.divisionId, taSet);
      }
      if (m.redTournamentAthleteId) taSet.add(m.redTournamentAthleteId);
      if (m.blueTournamentAthleteId) taSet.add(m.blueTournamentAthleteId);
    }
    const meta = new Map<string, ArenaRound0BracketMeta>();
    for (const [gid, athleteCount] of input.divisionAthleteCountById) {
      const round0MatchCount = round0CountByDivision.get(gid);
      if (round0MatchCount !== undefined) {
        meta.set(gid, {
          athleteCount,
          round0MatchCount,
          round0AthleteCount: distinctTaByDivision.get(gid)?.size ?? 0,
        });
      }
    }
    if (meta.size > 0) divisionBracketMeta = meta;
  }
  const divisionMaxRound = new Map<string, number>();
  for (const gid of input.divisionOrder) {
    const gm = input.matches.filter((m) => m.divisionId === gid);
    divisionMaxRound.set(
      gid,
      gm.length === 0 ? 0 : Math.max(...gm.map((m) => m.round))
    );
  }

  const rounds = [...new Set(input.matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const ordered: Array<MatchData> = [];

  for (const round of rounds) {
    for (const gid of input.divisionOrder) {
      const meta = divisionMeta.get(gid);
      if (!meta) continue;
      const roundMatches = input.matches.filter(
        (m) => m.divisionId === gid && m.round === round
      );
      if (roundMatches.length === 0) continue;
      const maxR = divisionMaxRound.get(gid) ?? 0;
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
    if (isArenaSequenceEligible(m, divisionBracketMeta, input.matches)) {
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
  const gid = matches[0]?.divisionId;
  if (!gid) return new Map();
  const divisionAthleteCountById =
    athleteCount !== undefined
      ? new Map<string, number>([[gid, athleteCount]])
      : undefined;
  return buildMatchNumber({
    arenaIndex,
    divisions: [{ id: gid, thirdPlaceMatch }],
    matches,
    divisionOrder: [gid],
    divisionAthleteCountById,
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
  divisionId: string,
  round: number,
  matchIndex: number,
  side: 'red' | 'blue',
  cornersSwapped = false
): MatchData | undefined {
  if (round <= 0) return undefined;
  const effectiveSide = cornersSwapped
    ? side === 'red'
      ? 'blue'
      : 'red'
    : side;
  const childIndex =
    effectiveSide === 'red' ? matchIndex * 2 : matchIndex * 2 + 1;
  return matches.find(
    (m) =>
      m.divisionId === divisionId &&
      m.round === round - 1 &&
      m.matchIndex === childIndex
  );
}
