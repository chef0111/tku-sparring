import { describe, expect, it } from 'vitest';

import {
  getAdminStatusTransition,
  getScoreTransition,
  getWinnerOverrideTransition,
} from '../match-transition';

const baseMatch = {
  status: 'pending',
  redWins: 0,
  blueWins: 0,
  redAthleteId: 'ap-red',
  blueAthleteId: 'ap-blue',
  redTournamentAthleteId: 'ta-red',
  blueTournamentAthleteId: 'ta-blue',
  winnerId: null,
  winnerTournamentAthleteId: null,
} as const;

describe('getScoreTransition', () => {
  it('marks red complete when red reaches wins needed', () => {
    expect(
      getScoreTransition({ match: baseMatch, redWins: 2, blueWins: 0 })
    ).toEqual({
      data: {
        redWins: 2,
        blueWins: 0,
        winnerId: 'ap-red',
        winnerTournamentAthleteId: 'ta-red',
        status: 'complete',
      },
      clearAdvancement: false,
      advanceWinnerTournamentAthleteId: 'ta-red',
    });
  });

  it('returns to pending at 0-0 when both slots are filled', () => {
    expect(
      getScoreTransition({
        match: { ...baseMatch, status: 'active' },
        redWins: 0,
        blueWins: 0,
      }).data.status
    ).toBe('pending');
  });
});

describe('getAdminStatusTransition', () => {
  it('downgrade from complete to active clears wins and winners', () => {
    expect(
      getAdminStatusTransition({
        match: {
          ...baseMatch,
          status: 'complete',
          redWins: 2,
          winnerTournamentAthleteId: 'ta-red',
          winnerId: 'ap-red',
        },
        status: 'active',
      })
    ).toEqual({
      data: {
        status: 'active',
        redWins: 0,
        blueWins: 0,
        winnerId: null,
        winnerTournamentAthleteId: null,
      },
      clearAdvancement: true,
      clearedScores: true,
    });
  });

  it('upgrade to complete does not clear scores', () => {
    expect(
      getAdminStatusTransition({
        match: {
          ...baseMatch,
          status: 'pending',
          redWins: 0,
          blueWins: 0,
          winnerId: null,
          winnerTournamentAthleteId: null,
        },
        status: 'complete',
      })
    ).toEqual({
      data: { status: 'complete' },
      clearAdvancement: false,
      clearedScores: false,
    });
  });
});

describe('getWinnerOverrideTransition', () => {
  it('winner override marks selected side complete', () => {
    expect(
      getWinnerOverrideTransition({ match: baseMatch, winnerSide: 'blue' })
    ).toEqual({
      data: {
        winnerId: 'ap-blue',
        winnerTournamentAthleteId: 'ta-blue',
        status: 'complete',
      },
      advanceWinnerTournamentAthleteId: 'ta-blue',
    });
  });
});
