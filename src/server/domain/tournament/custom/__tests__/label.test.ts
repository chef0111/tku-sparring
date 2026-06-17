import { describe, expect, it } from 'vitest';

import { validateCustomMatchLabel } from '@/server/domain/tournament/custom/label';

describe('validateCustomMatchLabel', () => {
  it('rejects empty labels', () => {
    expect(() => validateCustomMatchLabel('   ', [], new Set(), [])).toThrow(
      /label is required/
    );
  });

  it('rejects duplicate custom labels', () => {
    expect(() =>
      validateCustomMatchLabel(
        ' final preview ',
        [{ displayLabel: 'Final Preview' }],
        new Set(),
        []
      )
    ).toThrow(/already used/);
  });

  it('rejects arena Match {n} collisions', () => {
    expect(() =>
      validateCustomMatchLabel('Match 101', [], new Set(['match 101']), [])
    ).toThrow(/arena match number/);
  });

  it('rejects auto-generated match label suffix collisions', () => {
    expect(() =>
      validateCustomMatchLabel('Match abc123', [], new Set(), [
        { id: 'xxxxxxxxabc123', kind: 'bracket' },
      ])
    ).toThrow(/auto-generated match label/);
  });

  it('permits unique labels', () => {
    expect(() =>
      validateCustomMatchLabel(
        'Final Preview',
        [{ displayLabel: 'Other Match' }],
        new Set(),
        []
      )
    ).not.toThrow();
  });
});
