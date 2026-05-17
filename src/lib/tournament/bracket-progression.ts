export type BracketSide = 'red' | 'blue';

/** Minimal row shape for reset affordance (list payloads may use plain strings). */
export type BracketMatchResetActivityRow = {
  kind: string;
  round: number;
  status: string;
  redWins: number;
  blueWins: number;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
};

export function getSuccessorSlot(input: {
  round: number;
  matchIndex: number;
}): {
  round: number;
  matchIndex: number;
  side: BracketSide;
} {
  return {
    round: input.round + 1,
    matchIndex: Math.floor(input.matchIndex / 2),
    side: input.matchIndex % 2 === 0 ? 'red' : 'blue',
  };
}

export function isRound0ByeMatch(input: {
  round: number;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
}): boolean {
  return (
    input.round === 0 &&
    ((input.redTournamentAthleteId != null &&
      input.blueTournamentAthleteId == null) ||
      (input.redTournamentAthleteId == null &&
        input.blueTournamentAthleteId != null))
  );
}

/** Auto round-0 bye row after applyRound0ByeAdvancement: complete, 0–0, single athlete. */
export function isAutoRound0ByeCompleteMatch(
  input: BracketMatchResetActivityRow
): boolean {
  if (input.kind !== 'bracket') return false;
  return (
    isRound0ByeMatch(input) &&
    input.status === 'complete' &&
    input.redWins === 0 &&
    input.blueWins === 0
  );
}

/**
 * True when the group has custom rows or bracket bout state beyond a fresh
 * shuffle/regenerate. Auto round-0 bye completes (0–0) are ignored so the
 * reset control stays off until real edits.
 */
export function bracketHasResettableMatchActivity(
  matches: ReadonlyArray<BracketMatchResetActivityRow>
): boolean {
  for (const m of matches) {
    if (m.kind === 'custom') return true;
    if (m.kind !== 'bracket') continue;
    if (isAutoRound0ByeCompleteMatch(m)) continue;
    if (m.status !== 'pending') return true;
    if (m.redWins > 0 || m.blueWins > 0) return true;
  }
  return false;
}
