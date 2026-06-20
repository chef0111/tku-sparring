import { describe, expect, it } from 'vitest';
import {
  arenaIndicesForOrderPanel,
  arenaIndicesWithMultipleDivisions,
  mergeArenaDivisionOrderAfterCrossArenaMove,
  mergeArenaDivisionOrderAfterRetireArena,
  nextArenaSlotToAdd,
  patchArenaDivisionOrderJson,
  savedArenaDivisionIds,
  shouldShowArenaOrderUi,
  sortedDistinctArenaIndices,
} from '@/server/domain/tournament/arena/arena-division-order';

describe('savedArenaDivisionIds', () => {
  it('returns ordered ids for an arena key', () => {
    const raw = { '1': ['a', 'b'], '2': ['c'] };
    expect(savedArenaDivisionIds(raw, 1)).toEqual(['a', 'b']);
    expect(savedArenaDivisionIds(raw, 2)).toEqual(['c']);
  });

  it('returns undefined for invalid shapes', () => {
    expect(savedArenaDivisionIds(null, 1)).toBeUndefined();
    expect(savedArenaDivisionIds([], 1)).toBeUndefined();
    expect(savedArenaDivisionIds({ '1': 'x' }, 1)).toBeUndefined();
    expect(savedArenaDivisionIds({ '1': [1, 2] }, 1)).toBeUndefined();
  });
});

describe('mergeArenaDivisionOrderAfterCrossArenaMove', () => {
  it('moves division between arenas and updates both lists', () => {
    const divisions = [
      { id: 'a', arenaIndex: 1 },
      { id: 'b', arenaIndex: 1 },
      { id: 'c', arenaIndex: 2 },
    ];
    const raw = { '1': ['a', 'b'], '2': ['c'] };
    const next = mergeArenaDivisionOrderAfterCrossArenaMove({
      arenaDivisionOrder: raw,
      divisions,
      divisionId: 'b',
      fromArena: 1,
      toArena: 2,
      insertIndex: 0,
    });
    expect(next['1']).toEqual(['a']);
    expect(next['2']).toEqual(['b', 'c']);
  });
});

describe('patchArenaDivisionOrderJson', () => {
  it('merges one arena into existing map', () => {
    const next = patchArenaDivisionOrderJson({ '2': ['x'] }, 1, ['a', 'b']);
    expect(next).toEqual({ '2': ['x'], '1': ['a', 'b'] });
  });
});

describe('shouldShowArenaOrderUi', () => {
  it('is true when two distinct arenas', () => {
    expect(shouldShowArenaOrderUi([{ arenaIndex: 1 }, { arenaIndex: 2 }])).toBe(
      true
    );
  });
});

describe('arenaIndicesWithMultipleDivisions', () => {
  it('returns arenas with at least two divisions', () => {
    expect(
      arenaIndicesWithMultipleDivisions([
        { arenaIndex: 1 },
        { arenaIndex: 1 },
        { arenaIndex: 2 },
      ])
    ).toEqual([1]);
  });
});

describe('sortedDistinctArenaIndices', () => {
  it('returns sorted unique arenas', () => {
    expect(
      sortedDistinctArenaIndices([
        { arenaIndex: 2 },
        { arenaIndex: 1 },
        { arenaIndex: 2 },
      ])
    ).toEqual([1, 2]);
  });
});

describe('nextArenaSlotToAdd', () => {
  it('returns smallest free index in 1..3', () => {
    expect(nextArenaSlotToAdd([{ arenaIndex: 1 }], {})).toBe(2);
  });
});

describe('arenaIndicesForOrderPanel', () => {
  it('includes reserved JSON-only arena slots', () => {
    expect(arenaIndicesForOrderPanel([{ arenaIndex: 1 }], { '2': [] })).toEqual(
      [1, 2]
    );
  });
});

describe('mergeArenaDivisionOrderAfterRetireArena', () => {
  it('moves all from-arena ids onto to-arena and clears from', () => {
    const next = mergeArenaDivisionOrderAfterRetireArena({
      arenaDivisionOrder: { '1': ['a', 'b'], '2': ['c'] },
      divisions: [
        { id: 'a', arenaIndex: 1 },
        { id: 'b', arenaIndex: 1 },
        { id: 'c', arenaIndex: 2 },
      ],
      fromArena: 1,
      toArena: 2,
    });
    expect(next['1']).toEqual([]);
    expect(next['2']).toEqual(['c', 'a', 'b']);
  });
});
