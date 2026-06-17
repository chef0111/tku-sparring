import { describe, expect, it } from 'vitest';

import { deriveGroupStatusForSelectionView } from '@/server/domain/tournament/advance/selection-status';

describe('deriveGroupStatusForSelectionView', () => {
  it('marks completed when tournament is completed', () => {
    expect(deriveGroupStatusForSelectionView('completed', [])).toBe(
      'completed'
    );
    expect(deriveGroupStatusForSelectionView('completed', ['pending'])).toBe(
      'completed'
    );
  });

  it('draft when tournament is draft and group has no matches', () => {
    expect(deriveGroupStatusForSelectionView('draft', [])).toBe('draft');
  });

  it('completed when all matches are complete', () => {
    expect(
      deriveGroupStatusForSelectionView('active', ['complete', 'complete'])
    ).toBe('completed');
  });

  it('active when tournament is active and matches remain', () => {
    expect(
      deriveGroupStatusForSelectionView('active', ['complete', 'pending'])
    ).toBe('active');
  });
});
