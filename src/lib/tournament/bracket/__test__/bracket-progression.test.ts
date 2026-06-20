import { describe, expect, it } from 'vitest';

import {
  getSuccessorSlot,
  isAutoRound0ByeCompleteMatch,
  isResettableMatch,
  isRound0ByeMatch,
} from '../bracket-progression';
import type { MatchData } from '@/contracts/tournament/match';

function baseBracket(over: Partial<MatchData> = {}): MatchData {
  return {
    id: 'm1',
    kind: 'bracket',
    displayLabel: null,
    round: 0,
    matchIndex: 0,
    status: 'pending',
    redAthleteId: null,
    blueAthleteId: null,
    redTournamentAthleteId: null,
    blueTournamentAthleteId: null,
    redWins: 0,
    blueWins: 0,
    winnerId: null,
    tournamentWinnerId: null,
    redLocked: false,
    blueLocked: false,
    cornersSwapped: false,
    updatedAt: new Date(0),
    groupId: 'g1',
    tournamentId: 't1',
    ...over,
  };
}

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

describe('isAutoRound0ByeCompleteMatch', () => {
  it('detects server bye auto-complete rows', () => {
    expect(
      isAutoRound0ByeCompleteMatch(
        baseBracket({
          redTournamentAthleteId: 'ta1',
          blueTournamentAthleteId: null,
          status: 'complete',
          redWins: 0,
          blueWins: 0,
        })
      )
    ).toBe(true);
  });

  it('is false for a fought complete match with wins', () => {
    expect(
      isAutoRound0ByeCompleteMatch(
        baseBracket({
          redTournamentAthleteId: 'ta1',
          blueTournamentAthleteId: 'ta2',
          status: 'complete',
          redWins: 2,
          blueWins: 0,
        })
      )
    ).toBe(false);
  });
});

describe('isResettableMatch', () => {
  it('is false when only auto bye completes exist', () => {
    expect(
      isResettableMatch([
        baseBracket({
          redTournamentAthleteId: 'ta1',
          blueTournamentAthleteId: null,
          status: 'complete',
          redWins: 0,
          blueWins: 0,
        }),
        baseBracket({
          id: 'm2',
          matchIndex: 1,
          redTournamentAthleteId: 'ta2',
          blueTournamentAthleteId: 'ta3',
          status: 'pending',
        }),
      ])
    ).toBe(false);
  });

  it('is true for any custom match', () => {
    expect(
      isResettableMatch([
        baseBracket(),
        baseBracket({
          id: 'c1',
          kind: 'custom',
          round: 900,
          matchIndex: 0,
        }),
      ])
    ).toBe(true);
  });

  it('is true for active or scored bracket rows', () => {
    expect(isResettableMatch([baseBracket({ status: 'active' })])).toBe(true);
    expect(isResettableMatch([baseBracket({ redWins: 1, blueWins: 0 })])).toBe(
      true
    );
  });
});
