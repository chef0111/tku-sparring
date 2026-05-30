import { describe, expect, it } from 'vitest';

import {
  buildAdminStatusPlan,
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
  tournamentWinnerId: null,
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
        tournamentWinnerId: 'ta-red',
        status: 'complete',
      },
      clearAdvancement: false,
      advancedWinnerId: 'ta-red',
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
          status: 'complete',
          tournamentWinnerId: 'ta-red',
        },
        status: 'active',
      })
    ).toEqual({
      data: {
        status: 'active',
        redWins: 0,
        blueWins: 0,
        winnerId: null,
        tournamentWinnerId: null,
      },
      clearAdvancement: true,
      clearedScores: true,
    });
  });

  it('upgrade to complete does not clear scores', () => {
    expect(
      getAdminStatusTransition({
        match: {
          status: 'pending',
          tournamentWinnerId: null,
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
        tournamentWinnerId: 'ta-blue',
        status: 'complete',
      },
      advancedWinnerId: 'ta-blue',
    });
  });
});

describe('buildAdminStatusPlan', () => {
  it('derives winner from existing scores when marking complete', () => {
    expect(
      buildAdminStatusPlan({
        match: {
          ...baseMatch,
          status: 'active',
          redWins: 2,
          blueWins: 0,
        },
        status: 'complete',
      })
    ).toEqual({
      data: {
        redWins: 2,
        blueWins: 0,
        winnerId: 'ap-red',
        tournamentWinnerId: 'ta-red',
        status: 'complete',
      },
      clearAdvancement: false,
      advancedWinnerId: 'ta-red',
      clearedScores: false,
    });
  });

  it('keeps status-only complete when scores do not finish the match', () => {
    expect(
      buildAdminStatusPlan({
        match: baseMatch,
        status: 'complete',
      })
    ).toEqual({
      data: { status: 'complete' },
      clearAdvancement: false,
      advancedWinnerId: null,
      clearedScores: false,
    });
  });
});
