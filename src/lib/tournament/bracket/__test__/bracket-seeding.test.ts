import { describe, expect, it } from 'vitest';

import { buildSlotMap } from '../bracket-seeding';

describe('buildSlotMap', () => {
  it('size 2 -> [1, 2]', () => {
    expect(buildSlotMap(2)).toEqual([1, 2]);
  });

  it('size 4 -> [1, 4, 2, 3]', () => {
    expect(buildSlotMap(4)).toEqual([1, 4, 2, 3]);
  });

  it('size 8 -> [1, 8, 4, 5, 2, 7, 3, 6]', () => {
    expect(buildSlotMap(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('size 16 follows standard pattern (seeds 1, 16, 8, 9, 4, ...)', () => {
    const m = buildSlotMap(16);
    expect(m[0]).toBe(1);
    expect(m[1]).toBe(16);
    expect(m[2]).toBe(8);
    expect(m[3]).toBe(9);
    expect(new Set(m).size).toBe(16);
  });

  it('throws if size is not a power of two', () => {
    expect(() => buildSlotMap(6)).toThrow();
  });
});
