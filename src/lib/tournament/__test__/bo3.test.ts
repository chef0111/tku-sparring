import { describe, expect, it } from 'vitest';

import {
  BO3_MAX_ROUNDS,
  BO3_WINS_NEEDED,
  completedRoundsFromWins,
  deriveArenaCurrentRound,
} from '../bo3';

describe('bo3', () => {
  it('uses fixed wins needed and max rounds', () => {
    expect(BO3_WINS_NEEDED).toBe(2);
    expect(BO3_MAX_ROUNDS).toBe(3);
  });

  it('deriveArenaCurrentRound is next round to play (1-based)', () => {
    expect(deriveArenaCurrentRound(0, 0)).toBe(1);
    expect(deriveArenaCurrentRound(1, 0)).toBe(2);
    expect(deriveArenaCurrentRound(0, 1)).toBe(2);
    expect(deriveArenaCurrentRound(1, 1)).toBe(3);
    expect(deriveArenaCurrentRound(2, 0)).toBe(3);
    expect(deriveArenaCurrentRound(0, 2)).toBe(3);
  });

  it('completedRoundsFromWins sums wins', () => {
    expect(completedRoundsFromWins(1, 1)).toBe(2);
  });
});
