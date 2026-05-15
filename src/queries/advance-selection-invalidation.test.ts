import { describe, expect, it } from 'vitest';

import { shouldInvalidateAdvanceSelection } from './advance-selection-invalidation';

describe('shouldInvalidateAdvanceSelection', () => {
  it('matches selectionCatalog key with tournament id at index 3', () => {
    expect(
      shouldInvalidateAdvanceSelection('t-a', [
        'advanceSettings',
        'selectionCatalog',
        null,
        't-a',
      ])
    ).toBe(true);

    expect(
      shouldInvalidateAdvanceSelection('t-a', [
        'advanceSettings',
        'selectionCatalog',
        null,
        'other',
      ])
    ).toBe(false);
  });

  it('matches selectionMatches key with tournament id at index 3', () => {
    expect(
      shouldInvalidateAdvanceSelection('t-a', [
        'advanceSettings',
        'selectionMatches',
        null,
        't-a',
        'g-1',
      ])
    ).toBe(true);

    expect(
      shouldInvalidateAdvanceSelection('t-a', [
        'advanceSettings',
        'selectionMatches',
        null,
        'other',
        'g-1',
      ])
    ).toBe(false);
  });
});
