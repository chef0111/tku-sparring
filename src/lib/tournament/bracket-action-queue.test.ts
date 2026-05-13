import { describe, expect, it } from 'vitest';
import { buildBracketActionQueue } from './bracket-action-queue';
import type { BracketActionQueueItem } from './bracket-action-queue';
import type { MatchData } from '@/features/dashboard/types';

function baseMatch(over: Partial<MatchData>): MatchData {
  return {
    id: over.id ?? 'm1',
    round: over.round ?? 0,
    matchIndex: over.matchIndex ?? 0,
    status: over.status ?? 'pending',
    bestOf: over.bestOf ?? 3,
    redAthleteId: over.redAthleteId ?? null,
    blueAthleteId: over.blueAthleteId ?? null,
    redTournamentAthleteId: over.redTournamentAthleteId ?? null,
    blueTournamentAthleteId: over.blueTournamentAthleteId ?? null,
    redWins: over.redWins ?? 0,
    blueWins: over.blueWins ?? 0,
    winnerId: over.winnerId ?? null,
    winnerTournamentAthleteId: over.winnerTournamentAthleteId ?? null,
    redLocked: over.redLocked ?? false,
    blueLocked: over.blueLocked ?? false,
    groupId: over.groupId ?? 'g1',
    tournamentId: over.tournamentId ?? 't1',
  };
}

describe('buildBracketActionQueue', () => {
  it('skips matches with both athletes empty', () => {
    const matches = [
      baseMatch({ id: 'a', round: 0, matchIndex: 0 }),
      baseMatch({
        id: 'b',
        round: 0,
        matchIndex: 1,
        redTournamentAthleteId: 'r1',
        blueTournamentAthleteId: 'b1',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.map((x: BracketActionQueueItem) => x.match.id)).toEqual(['b']);
  });

  it('sorts by round then matchIndex', () => {
    const matches = [
      baseMatch({
        id: 'later',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: null,
      }),
      baseMatch({
        id: 'earlier',
        round: 0,
        matchIndex: 1,
        redTournamentAthleteId: 'r2',
        blueTournamentAthleteId: null,
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q.map((x: BracketActionQueueItem) => x.match.id)).toEqual([
      'earlier',
      'later',
    ]);
  });

  it('includes open corners and no-winner when both filled', () => {
    const matches = [
      baseMatch({
        id: 'm',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b',
        winnerTournamentAthleteId: null,
        status: 'pending',
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q).toHaveLength(1);
    expect(q[0]!.reasons).toContain('No winner recorded');
  });

  it('excludes complete matches with a winner', () => {
    const matches = [
      baseMatch({
        id: 'm',
        round: 0,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: 'b',
        winnerTournamentAthleteId: 'wta',
        status: 'complete',
      }),
    ];
    expect(buildBracketActionQueue(matches)).toHaveLength(0);
  });

  it('includes one-sided empty for later rounds', () => {
    const matches = [
      baseMatch({
        id: 'sf',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: 'r',
        blueTournamentAthleteId: null,
      }),
    ];
    const q = buildBracketActionQueue(matches);
    expect(q).toHaveLength(1);
    expect(q[0]!.reasons).toEqual(['Open blue corner']);
  });
});
