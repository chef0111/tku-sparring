import type { MatchData } from '@/features/dashboard/types';

export interface BracketActionQueueItem {
  match: MatchData;
  reasons: Array<string>;
}

/**
 * Matches that need admin attention: open slots or filled matches without a recorded winner.
 * Skips rows where both athletes are empty (unused shell nodes).
 */
export function buildBracketActionQueue(
  matches: Array<MatchData>
): Array<BracketActionQueueItem> {
  if (matches.length === 0) return [];

  const sorted = [...matches].sort(
    (a, b) => a.round - b.round || a.matchIndex - b.matchIndex
  );
  const out: Array<BracketActionQueueItem> = [];

  for (const m of sorted) {
    const emptyRed = m.redTournamentAthleteId == null;
    const emptyBlue = m.blueTournamentAthleteId == null;
    if (emptyRed && emptyBlue) continue;

    const reasons: Array<string> = [];
    if (emptyRed) reasons.push('No opponent');
    if (emptyBlue) reasons.push('No opponent');

    const bothFilled = !emptyRed && !emptyBlue;
    if (bothFilled && m.winnerTournamentAthleteId == null) {
      reasons.push('No winner recorded');
    }

    if (reasons.length === 0) continue;
    out.push({ match: m, reasons });
  }

  return out;
}
