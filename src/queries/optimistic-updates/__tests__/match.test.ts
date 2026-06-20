import { describe, expect, it } from 'vitest';

import type { MatchData } from '@/contracts/tournament/match';
import { applyOptimisticUpdateScore } from '@/queries/optimistic-updates/match';

function baseMatch(over: Partial<MatchData> = {}): MatchData {
  return {
    id: 'm-r0-0',
    kind: 'bracket',
    displayLabel: null,
    round: 0,
    matchIndex: 0,
    status: 'pending',
    redAthleteId: 'ap-red',
    blueAthleteId: 'ap-blue',
    redTournamentAthleteId: 'ta-red',
    blueTournamentAthleteId: 'ta-blue',
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    tournamentWinnerId: null,
    redLocked: false,
    blueLocked: false,
    cornersSwapped: false,
    updatedAt: new Date(0),
    divisionId: 'g1',
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
    expect(next[0]?.tournamentWinnerId).toBe('ta-red');
    expect(next[1]?.redTournamentAthleteId).toBe('ta-red');
    expect(next[1]?.redAthleteId).toBe('ap-red');
  });
});
