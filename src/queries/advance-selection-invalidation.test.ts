import { describe, expect, it } from 'vitest';

import { shouldInvalidateAdvanceSelection } from './advance-selection-invalidation';

describe('shouldInvalidateAdvanceSelection', () => {
  it('invalidates every selectionCatalog query on tournament invalidate', () => {
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
    ).toBe(true);

    expect(
      shouldInvalidateAdvanceSelection('t-a', [
        'advanceSettings',
        'selectionCatalog',
        null,
        null,
      ])
    ).toBe(true);
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
