/**
 * Pure data shapes and shuffle utilities shared by {@link MatchDAL} bracket mutations
 * (shuffle, reset, regenerate). Keeps progression-clearing rules in one place for locality.
 */

function clearMatchProgressionData() {
  return {
    redTournamentAthleteId: null,
    blueTournamentAthleteId: null,
    redAthleteId: null,
    blueAthleteId: null,
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    winnerTournamentAthleteId: null,
    status: 'pending' as const,
  };
}

/** Clears slots, scores, winners, and round-0 locks on every match row (bracket + custom). */
export function clearAllGroupMatchRowsData() {
  return {
    ...clearMatchProgressionData(),
    redLocked: false,
    blueLocked: false,
  };
}

/** Bracket rounds above round 0 do not use slot locks in the product model. */
export function clearBracketUpperRoundData() {
  return {
    ...clearMatchProgressionData(),
    redLocked: false,
    blueLocked: false,
  };
}

/** Clear bout state on a round-0 row before reshuffle; keep locked slot assignments. */
export function round0ShuffleResetPatch(m: {
  redLocked: boolean;
  blueLocked: boolean;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redAthleteId: string | null;
  blueAthleteId: string | null;
}) {
  return {
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    winnerTournamentAthleteId: null,
    status: 'pending' as const,
    redTournamentAthleteId:
      m.redLocked && m.redTournamentAthleteId != null
        ? m.redTournamentAthleteId
        : null,
    blueTournamentAthleteId:
      m.blueLocked && m.blueTournamentAthleteId != null
        ? m.blueTournamentAthleteId
        : null,
    redAthleteId: m.redLocked && m.redAthleteId != null ? m.redAthleteId : null,
    blueAthleteId:
      m.blueLocked && m.blueAthleteId != null ? m.blueAthleteId : null,
  };
}

/** Uniform random permutation (Math.random). */
export function shuffleAthletePool<T>(items: Array<T>): Array<T> {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
