import { describe, expect, it } from 'vitest';

import type { MatchData } from '@/features/dashboard/types';
import { applyOptimisticUpdateScore } from '@/lib/queries/matches';

function baseMatch(over: Partial<MatchData> = {}): MatchData {
  return {
    id: 'm-r0-0',
    kind: 'bracket',
    displayLabel: null,
    round: 0,
    matchIndex: 0,
    status: 'pending',
    bestOf: 3,
    redAthleteId: 'ap-red',
    blueAthleteId: 'ap-blue',
    redTournamentAthleteId: 'ta-red',
    blueTournamentAthleteId: 'ta-blue',
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    winnerTournamentAthleteId: null,
    redLocked: false,
    blueLocked: false,
    updatedAt: new Date(0),
    groupId: 'g1',
    tournamentId: 't1',
    ...over,
  };
}

describe('applyOptimisticUpdateScore', () => {
  it('writes the winner into the successor slot when a match completes 2-0', () => {
    const matches = [
      baseMatch(),
      baseMatch({
        id: 'm-r1-0',
        round: 1,
        matchIndex: 0,
        redTournamentAthleteId: null,
        blueTournamentAthleteId: null,
        redAthleteId: null,
        blueAthleteId: null,
      }),
    ];

    const next = applyOptimisticUpdateScore(matches, {
      matchId: 'm-r0-0',
      redWins: 2,
      blueWins: 0,
    });

    expect(next[0]?.status).toBe('complete');
    expect(next[0]?.winnerTournamentAthleteId).toBe('ta-red');
    expect(next[1]?.redTournamentAthleteId).toBe('ta-red');
    expect(next[1]?.redAthleteId).toBe('ap-red');
  });
});
