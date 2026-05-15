import { describe, expect, it } from 'vitest';

import { getSuccessorSlot, isRound0ByeMatch } from '../bracket-progression';

describe('getSuccessorSlot', () => {
  it('maps even match indexes to the red side of the next match', () => {
    expect(getSuccessorSlot({ round: 0, matchIndex: 2 })).toEqual({
      round: 1,
      matchIndex: 1,
      side: 'red',
    });
  });

  it('maps odd match indexes to the blue side of the next match', () => {
    expect(getSuccessorSlot({ round: 0, matchIndex: 3 })).toEqual({
      round: 1,
      matchIndex: 1,
      side: 'blue',
    });
  });
});

describe('isRound0ByeMatch', () => {
  it('is true only when exactly one tournament athlete is present in round 0', () => {
    expect(
      isRound0ByeMatch({
        round: 0,
        redTournamentAthleteId: 'ta1',
        blueTournamentAthleteId: null,
      })
    ).toBe(true);
    expect(
      isRound0ByeMatch({
        round: 0,
        redTournamentAthleteId: null,
        blueTournamentAthleteId: 'ta2',
      })
    ).toBe(true);
    expect(
      isRound0ByeMatch({
        round: 0,
        redTournamentAthleteId: 'ta1',
        blueTournamentAthleteId: 'ta2',
      })
    ).toBe(false);
    expect(
      isRound0ByeMatch({
        round: 1,
        redTournamentAthleteId: 'ta1',
        blueTournamentAthleteId: null,
      })
    ).toBe(false);
  });
});
