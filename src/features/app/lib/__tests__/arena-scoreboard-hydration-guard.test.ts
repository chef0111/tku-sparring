import { describe, expect, it } from 'vitest';

import { isServerMatchRowForSelectedBout } from '../arena-scoreboard-hydration-guard';

describe('isServerMatchRowForSelectedBout', () => {
  it('rejects when row id differs from selected bout', () => {
    expect(
      isServerMatchRowForSelectedBout('507f1f77bcf86cd799439011', {
        id: '507f191e810c19729de860ea',
      })
    ).toBe(false);
  });

  it('accepts when ids match', () => {
    const id = '507f1f77bcf86cd799439011';
    expect(isServerMatchRowForSelectedBout(id, { id })).toBe(true);
  });

  it('rejects null/undefined row', () => {
    expect(
      isServerMatchRowForSelectedBout('507f1f77bcf86cd799439011', null)
    ).toBe(false);
  });
});
