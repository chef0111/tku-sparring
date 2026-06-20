import type { MatchData } from '@/contracts/tournament/match';
import { buildSlotMap } from '@/lib/tournament/bracket/bracket-seeding';

export type ArenaRound0BracketMeta = {
  athleteCount: number;
  round0MatchCount: number;
  round0AthleteCount: number;
};

function getFeederMatch(
  matches: ReadonlyArray<MatchData>,
  groupId: string,
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
      m.groupId === groupId &&
      m.round === round - 1 &&
      m.matchIndex === childIndex
  );
}

export function isArenaSequenceEligible(
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

    const { athleteCount: n, round0MatchCount, round0AthleteCount: k } = meta;
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

  const fr = getFeederMatch(
    allMatches,
    match.groupId,
    match.round,
    match.matchIndex,
    'red'
  );
  const fb = getFeederMatch(
    allMatches,
    match.groupId,
    match.round,
    match.matchIndex,
    'blue'
  );
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
