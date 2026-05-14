import { describe, expect, it } from 'vitest';
import {
  arenaIndicesForOrderPanel,
  arenaIndicesWithMultipleGroups,
  mergeArenaGroupOrderAfterCrossArenaMove,
  mergeArenaGroupOrderAfterRetireArena,
  nextArenaSlotToAdd,
  patchArenaGroupOrderJson,
  savedArenaGroupIds,
  shouldShowArenaOrderUi,
  sortedDistinctArenaIndices,
} from '../arena-group-order';

describe('savedArenaGroupIds', () => {
  it('returns ordered ids for an arena key', () => {
    const raw = { '1': ['a', 'b'], '2': ['c'] };
    expect(savedArenaGroupIds(raw, 1)).toEqual(['a', 'b']);
    expect(savedArenaGroupIds(raw, 2)).toEqual(['c']);
  });

  it('returns undefined for invalid shapes', () => {
    expect(savedArenaGroupIds(null, 1)).toBeUndefined();
    expect(savedArenaGroupIds([], 1)).toBeUndefined();
    expect(savedArenaGroupIds({ '1': 'x' }, 1)).toBeUndefined();
    expect(savedArenaGroupIds({ '1': [1, 2] }, 1)).toBeUndefined();
  });
});

describe('arenaIndicesWithMultipleGroups', () => {
  it('returns arenas with at least two groups', () => {
    const groups = [
      { arenaIndex: 1 },
      { arenaIndex: 1 },
      { arenaIndex: 2 },
      { arenaIndex: 3 },
      { arenaIndex: 3 },
    ];
    expect(arenaIndicesWithMultipleGroups(groups)).toEqual([1, 3]);
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

describe('shouldShowArenaOrderUi', () => {
  it('is true when two distinct arenas', () => {
    expect(shouldShowArenaOrderUi([{ arenaIndex: 1 }, { arenaIndex: 2 }])).toBe(
      true
    );
  });

  it('is true when two groups share one arena', () => {
    expect(shouldShowArenaOrderUi([{ arenaIndex: 1 }, { arenaIndex: 1 }])).toBe(
      true
    );
  });

  it('is false when one arena and one group and no addable slot', () => {
    expect(shouldShowArenaOrderUi([{ arenaIndex: 1 }])).toBe(false);
  });

  it('is true when one arena and one group but a slot can be added', () => {
    expect(shouldShowArenaOrderUi([{ arenaIndex: 1 }], {})).toBe(true);
  });
});

describe('nextArenaSlotToAdd', () => {
  it('returns smallest free index in 1..3', () => {
    expect(nextArenaSlotToAdd([{ arenaIndex: 1 }], {})).toBe(2);
    expect(nextArenaSlotToAdd([{ arenaIndex: 1 }, { arenaIndex: 3 }], {})).toBe(
      2
    );
  });

  it('returns null when all three indices are occupied', () => {
    const groups = [{ arenaIndex: 1 }, { arenaIndex: 2 }, { arenaIndex: 3 }];
    expect(nextArenaSlotToAdd(groups, {})).toBeNull();
  });
});

describe('arenaIndicesForOrderPanel', () => {
  it('includes reserved JSON-only arena slots', () => {
    const groups = [{ arenaIndex: 1 }];
    const raw = { '1': ['a'], '2': [] };
    expect(arenaIndicesForOrderPanel(groups, raw)).toEqual([1, 2]);
  });
});

describe('mergeArenaGroupOrderAfterRetireArena', () => {
  it('moves all from-arena ids onto to-arena and clears from', () => {
    const groups = [
      { id: 'a', arenaIndex: 1 },
      { id: 'b', arenaIndex: 1 },
      { id: 'c', arenaIndex: 2 },
    ];
    const raw = { '1': ['a', 'b'], '2': ['c'] };
    const next = mergeArenaGroupOrderAfterRetireArena({
      arenaGroupOrder: raw,
      groups,
      fromArena: 1,
      toArena: 2,
    });
    expect(next['1']).toEqual([]);
    expect(next['2']).toEqual(['c', 'a', 'b']);
  });

  it('throws when from and to arena are equal', () => {
    expect(() =>
      mergeArenaGroupOrderAfterRetireArena({
        arenaGroupOrder: {},
        groups: [{ id: 'a', arenaIndex: 1 }],
        fromArena: 1,
        toArena: 1,
      })
    ).toThrow();
  });
});

describe('mergeArenaGroupOrderAfterCrossArenaMove', () => {
  it('moves group between arenas and updates both lists', () => {
    const groups = [
      { id: 'a', arenaIndex: 1 },
      { id: 'b', arenaIndex: 1 },
      { id: 'c', arenaIndex: 2 },
    ];
    const raw = { '1': ['a', 'b'], '2': ['c'] };
    const next = mergeArenaGroupOrderAfterCrossArenaMove({
      arenaGroupOrder: raw,
      groups,
      groupId: 'b',
      fromArena: 1,
      toArena: 2,
      insertIndex: 0,
    });
    expect(next['1']).toEqual(['a']);
    expect(next['2']).toEqual(['b', 'c']);
  });

  it('throws when from and to arena are equal', () => {
    expect(() =>
      mergeArenaGroupOrderAfterCrossArenaMove({
        arenaGroupOrder: {},
        groups: [{ id: 'a', arenaIndex: 1 }],
        groupId: 'a',
        fromArena: 1,
        toArena: 1,
        insertIndex: 0,
      })
    ).toThrow();
  });
});

describe('patchArenaGroupOrderJson', () => {
  it('merges one arena into existing map', () => {
    const next = patchArenaGroupOrderJson({ '2': ['x'] }, 1, ['a', 'b']);
    expect(next).toEqual({ '2': ['x'], '1': ['a', 'b'] });
  });

  it('replaces string[] values only from current', () => {
    const next = patchArenaGroupOrderJson(
      { '1': 'bad' as unknown as Array<string> },
      1,
      ['a']
    );
    expect(next).toEqual({ '1': ['a'] });
  });
});
