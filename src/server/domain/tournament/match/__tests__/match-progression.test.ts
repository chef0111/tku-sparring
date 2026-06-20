import { describe, expect, it } from 'vitest';

import {
  clearAdvancePatch,
  round0ByePlan,
  successorWhere,
  winnerAdvancePatch,
} from '@/server/domain/tournament/match/match-progression';

describe('successorWhere', () => {
  it('maps round-0 match index 0 to round-1 match 0', () => {
    expect(
      successorWhere({ divisionId: 'group-1', round: 0, matchIndex: 0 })
    ).toEqual({
      kind: 'bracket',
      divisionId: 'group-1',
      round: 1,
      matchIndex: 0,
    });
  });
});

describe('winnerAdvancePatch', () => {
  it('writes winner to the red side of the successor match', () => {
    expect(
      winnerAdvancePatch(
        { round: 0, matchIndex: 0 },
        { cornersSwapped: false },
        { tournamentAthleteId: 'ta-red', athleteProfileId: 'ap-red' }
      )
    ).toEqual({
      redTournamentAthleteId: 'ta-red',
      redAthleteId: 'ap-red',
    });
  });

  it('writes winner to the blue side when feeder match index is odd', () => {
    expect(
      winnerAdvancePatch(
        { round: 0, matchIndex: 1 },
        { cornersSwapped: false },
        { tournamentAthleteId: 'ta-blue', athleteProfileId: 'ap-blue' }
      )
    ).toEqual({
      blueTournamentAthleteId: 'ta-blue',
      blueAthleteId: 'ap-blue',
    });
  });

  it('writes winner to the opposite corner when successor has cornersSwapped', () => {
    expect(
      winnerAdvancePatch(
        { round: 0, matchIndex: 0 },
        { cornersSwapped: true },
        { tournamentAthleteId: 'ta-red', athleteProfileId: 'ap-red' }
      )
    ).toEqual({
      blueTournamentAthleteId: 'ta-red',
      blueAthleteId: 'ap-red',
    });
  });
});

describe('clearAdvancePatch', () => {
  it('clears red when winner occupied the red successor slot', () => {
    expect(
      clearAdvancePatch(
        { round: 0, matchIndex: 0, tournamentWinnerId: 'ta-red' },
        {
          cornersSwapped: false,
          redTournamentAthleteId: 'ta-red',
          blueTournamentAthleteId: null,
        }
      )
    ).toEqual({ redTournamentAthleteId: null, redAthleteId: null });
  });

  it('returns null when successor corner does not hold the winner', () => {
    expect(
      clearAdvancePatch(
        { round: 0, matchIndex: 0, tournamentWinnerId: 'ta-red' },
        {
          cornersSwapped: false,
          redTournamentAthleteId: 'ta-other',
          blueTournamentAthleteId: null,
        }
      )
    ).toBeNull();
  });
});

describe('round0ByePlan', () => {
  it('plans completion and advance for a single-athlete round-0 row', () => {
    expect(
      round0ByePlan({
        id: 'm-r0-0',
        round: 0,
        redTournamentAthleteId: 'ta-red',
        blueTournamentAthleteId: null,
        redAthleteId: 'ap-red',
        blueAthleteId: null,
      })
    ).toEqual({
      matchId: 'm-r0-0',
      completion: {
        status: 'complete',
        tournamentWinnerId: 'ta-red',
        winnerId: 'ap-red',
        redWins: 0,
        blueWins: 0,
      },
      advanceWinnerId: 'ta-red',
    });
  });

  it('returns null for non-bye round-0 rows', () => {
    expect(
      round0ByePlan({
        id: 'm-r0-0',
        round: 0,
        redTournamentAthleteId: 'ta-red',
        blueTournamentAthleteId: 'ta-blue',
        redAthleteId: 'ap-red',
        blueAthleteId: 'ap-blue',
      })
    ).toBeNull();
  });
});
