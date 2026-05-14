import { resolveArenaGroupOrder } from './arena-match-label';

export const TOURNAMENT_MAX_ARENAS = 3;

/**
 * Reads `Tournament.arenaGroupOrder` JSON (map of arena index string → group id list).
 * @see docs/bracket-generation.md
 */
export function savedArenaGroupIds(
  arenaGroupOrder: unknown,
  arenaIndex: number
): Array<string> | undefined {
  if (
    arenaGroupOrder == null ||
    typeof arenaGroupOrder !== 'object' ||
    Array.isArray(arenaGroupOrder)
  ) {
    return undefined;
  }
  const row = (arenaGroupOrder as Record<string, unknown>)[String(arenaIndex)];
  if (!Array.isArray(row)) return undefined;
  const ids: Array<string> = [];
  for (const x of row) {
    if (typeof x !== 'string') return undefined;
    ids.push(x);
  }
  return ids;
}

export function patchArenaGroupOrderJson(
  current: unknown,
  arenaIndex: number,
  groupIds: Array<string>
): Record<string, Array<string>> {
  const base: Record<string, Array<string>> = {};
  if (
    current != null &&
    typeof current === 'object' &&
    !Array.isArray(current)
  ) {
    for (const [k, v] of Object.entries(current as Record<string, unknown>)) {
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        base[k] = v as Array<string>;
      }
    }
  }
  base[String(arenaIndex)] = groupIds;
  return base;
}

/** Arena indices that have two or more groups (shared match numbering order applies). */
export function arenaIndicesWithMultipleGroups(
  groups: ReadonlyArray<{ arenaIndex: number }>
): Array<number> {
  const byArena = new Map<number, number>();
  for (const g of groups) {
    byArena.set(g.arenaIndex, (byArena.get(g.arenaIndex) ?? 0) + 1);
  }
  return [...byArena.entries()]
    .filter(([, n]) => n >= 2)
    .map(([a]) => a)
    .sort((a, b) => a - b);
}

/** Distinct arena indices that have at least one group, ascending. */
export function sortedDistinctArenaIndices(
  groups: ReadonlyArray<{ arenaIndex: number }>
): Array<number> {
  const s = new Set<number>();
  for (const g of groups) s.add(g.arenaIndex);
  return [...s].sort((a, b) => a - b);
}

function jsonArenaSlotKeysInRange(arenaGroupOrder: unknown): Set<number> {
  const s = new Set<number>();
  if (
    arenaGroupOrder == null ||
    typeof arenaGroupOrder !== 'object' ||
    Array.isArray(arenaGroupOrder)
  ) {
    return s;
  }
  const o = arenaGroupOrder as Record<string, unknown>;
  for (let i = 1; i <= TOURNAMENT_MAX_ARENAS; i++) {
    const row = o[String(i)];
    if (Array.isArray(row) && row.every((x) => typeof x === 'string')) {
      s.add(i);
    }
  }
  return s;
}

/** Arenas that have groups or a saved JSON row (including empty `[]` reserved slots). */
export function occupiedArenaIndices(
  groups: ReadonlyArray<{ arenaIndex: number }>,
  arenaGroupOrder: unknown
): Set<number> {
  const s = new Set<number>();
  for (const g of groups) {
    if (
      Number.isFinite(g.arenaIndex) &&
      g.arenaIndex >= 1 &&
      g.arenaIndex <= TOURNAMENT_MAX_ARENAS
    ) {
      s.add(g.arenaIndex);
    }
  }
  for (const k of jsonArenaSlotKeysInRange(arenaGroupOrder)) {
    s.add(k);
  }
  return s;
}

/** Smallest arena index in `1..TOURNAMENT_MAX_ARENAS` not yet used, or `null` if all are used. */
export function nextArenaSlotToAdd(
  groups: ReadonlyArray<{ arenaIndex: number }>,
  arenaGroupOrder: unknown
): number | null {
  const occ = occupiedArenaIndices(groups, arenaGroupOrder);
  for (let i = 1; i <= TOURNAMENT_MAX_ARENAS; i++) {
    if (!occ.has(i)) return i;
  }
  return null;
}

/** Column indices for the arena order UI (groups + reserved JSON slots). */
export function arenaIndicesForOrderPanel(
  groups: ReadonlyArray<{ arenaIndex: number }>,
  arenaGroupOrder: unknown
): Array<number> {
  return [...occupiedArenaIndices(groups, arenaGroupOrder)].sort(
    (a, b) => a - b
  );
}

/** Rail / toolbar: show arena order UI when reorder, cross-arena, or an arena slot can be added. */
export function shouldShowArenaOrderUi(
  groups: ReadonlyArray<{ arenaIndex: number }>,
  arenaGroupOrder?: unknown
): boolean {
  if (arenaIndicesWithMultipleGroups(groups).length > 0) return true;
  if (sortedDistinctArenaIndices(groups).length >= 2) return true;
  if (
    arenaGroupOrder !== undefined &&
    nextArenaSlotToAdd(groups, arenaGroupOrder) !== null
  ) {
    return true;
  }
  return false;
}

/**
 * After moving a group between arenas (DB group.arenaIndex not yet updated),
 * compute the next `arenaGroupOrder` JSON for both affected arenas.
 */
export function mergeArenaGroupOrderAfterCrossArenaMove(input: {
  arenaGroupOrder: unknown;
  groups: ReadonlyArray<{ id: string; arenaIndex: number }>;
  groupId: string;
  fromArena: number;
  toArena: number;
  insertIndex: number;
}): Record<string, Array<string>> {
  const { arenaGroupOrder, groups, groupId, fromArena, toArena, insertIndex } =
    input;
  if (fromArena === toArena) {
    throw new Error(
      'mergeArenaGroupOrderAfterCrossArenaMove requires fromArena !== toArena'
    );
  }

  const onFromAll = groups.filter((g) => g.arenaIndex === fromArena);
  const onToAll = groups.filter((g) => g.arenaIndex === toArena);
  const savedFrom = savedArenaGroupIds(arenaGroupOrder, fromArena);
  const savedTo = savedArenaGroupIds(arenaGroupOrder, toArena);
  const orderFrom = resolveArenaGroupOrder(onFromAll, savedFrom).filter(
    (id) => id !== groupId
  );
  const orderTo = resolveArenaGroupOrder(onToAll, savedTo);
  const clamped = Math.max(0, Math.min(insertIndex, orderTo.length));
  const nextTo = [
    ...orderTo.slice(0, clamped),
    groupId,
    ...orderTo.slice(clamped),
  ];

  let json = patchArenaGroupOrderJson(arenaGroupOrder, fromArena, orderFrom);
  json = patchArenaGroupOrderJson(json, toArena, nextTo);
  return json;
}

/**
 * Merge all groups from `fromArena` into `toArena` (DB updates applied separately).
 * Clears saved order for `fromArena` and appends moved ids after existing `toArena` order.
 */
export function mergeArenaGroupOrderAfterRetireArena(input: {
  arenaGroupOrder: unknown;
  groups: ReadonlyArray<{ id: string; arenaIndex: number }>;
  fromArena: number;
  toArena: number;
}): Record<string, Array<string>> {
  const { arenaGroupOrder, groups, fromArena, toArena } = input;
  if (fromArena === toArena) {
    throw new Error(
      'mergeArenaGroupOrderAfterRetireArena requires fromArena !== toArena'
    );
  }

  const onFrom = groups.filter((g) => g.arenaIndex === fromArena);
  const onTo = groups.filter((g) => g.arenaIndex === toArena);
  const savedFrom = savedArenaGroupIds(arenaGroupOrder, fromArena);
  const savedTo = savedArenaGroupIds(arenaGroupOrder, toArena);
  const fromOrder = resolveArenaGroupOrder(onFrom, savedFrom);
  const toOrder = resolveArenaGroupOrder(onTo, savedTo);
  const nextTo = [...toOrder];
  for (const id of fromOrder) {
    if (!nextTo.includes(id)) nextTo.push(id);
  }

  let json = patchArenaGroupOrderJson(arenaGroupOrder, toArena, nextTo);
  json = patchArenaGroupOrderJson(json, fromArena, []);
  return json;
}
