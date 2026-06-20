import { resolveArenaDivisionOrder } from './match-label';

export const TOURNAMENT_MAX_ARENAS = 3;

/**
 * Reads `Tournament.arenaDivisionOrder` JSON (map of arena index string → group id list).
 * @see docs/bracket-generation.md
 */
export function savedArenaDivisionIds(
  arenaDivisionOrder: unknown,
  arenaIndex: number
): Array<string> | undefined {
  if (
    arenaDivisionOrder == null ||
    typeof arenaDivisionOrder !== 'object' ||
    Array.isArray(arenaDivisionOrder)
  ) {
    return undefined;
  }
  const row = (arenaDivisionOrder as Record<string, unknown>)[
    String(arenaIndex)
  ];
  if (!Array.isArray(row)) return undefined;
  const ids: Array<string> = [];
  for (const x of row) {
    if (typeof x !== 'string') return undefined;
    ids.push(x);
  }
  return ids;
}

export function patchArenaDivisionOrderJson(
  current: unknown,
  arenaIndex: number,
  divisionIds: Array<string>
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
  base[String(arenaIndex)] = divisionIds;
  return base;
}

/** Arena indices that have two or more groups (shared match numbering order applies). */
export function arenaIndicesWithMultipleDivisions(
  divisions: ReadonlyArray<{ arenaIndex: number }>
): Array<number> {
  const byArena = new Map<number, number>();
  for (const g of divisions) {
    byArena.set(g.arenaIndex, (byArena.get(g.arenaIndex) ?? 0) + 1);
  }
  return [...byArena.entries()]
    .filter(([, n]) => n >= 2)
    .map(([a]) => a)
    .sort((a, b) => a - b);
}

/** Distinct arena indices that have at least one group, ascending. */
export function sortedDistinctArenaIndices(
  divisions: ReadonlyArray<{ arenaIndex: number }>
): Array<number> {
  const s = new Set<number>();
  for (const g of divisions) s.add(g.arenaIndex);
  return [...s].sort((a, b) => a - b);
}

function jsonArenaSlotKeysInRange(arenaDivisionOrder: unknown): Set<number> {
  const s = new Set<number>();
  if (
    arenaDivisionOrder == null ||
    typeof arenaDivisionOrder !== 'object' ||
    Array.isArray(arenaDivisionOrder)
  ) {
    return s;
  }
  const o = arenaDivisionOrder as Record<string, unknown>;
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
  divisions: ReadonlyArray<{ arenaIndex: number }>,
  arenaDivisionOrder: unknown
): Set<number> {
  const s = new Set<number>();
  for (const g of divisions) {
    if (
      Number.isFinite(g.arenaIndex) &&
      g.arenaIndex >= 1 &&
      g.arenaIndex <= TOURNAMENT_MAX_ARENAS
    ) {
      s.add(g.arenaIndex);
    }
  }
  for (const k of jsonArenaSlotKeysInRange(arenaDivisionOrder)) {
    s.add(k);
  }
  return s;
}

/** Smallest arena index in `1..TOURNAMENT_MAX_ARENAS` not yet used, or `null` if all are used. */
export function nextArenaSlotToAdd(
  divisions: ReadonlyArray<{ arenaIndex: number }>,
  arenaDivisionOrder: unknown
): number | null {
  const occ = occupiedArenaIndices(divisions, arenaDivisionOrder);
  for (let i = 1; i <= TOURNAMENT_MAX_ARENAS; i++) {
    if (!occ.has(i)) return i;
  }
  return null;
}

/** Column indices for the arena order UI (groups + reserved JSON slots). */
export function arenaIndicesForOrderPanel(
  divisions: ReadonlyArray<{ arenaIndex: number }>,
  arenaDivisionOrder: unknown
): Array<number> {
  return [...occupiedArenaIndices(divisions, arenaDivisionOrder)].sort(
    (a, b) => a - b
  );
}

/** Rail / toolbar: show arena order UI when reorder, cross-arena, or an arena slot can be added. */
export function shouldShowArenaOrderUi(
  divisions: ReadonlyArray<{ arenaIndex: number }>,
  arenaDivisionOrder?: unknown
): boolean {
  if (arenaIndicesWithMultipleDivisions(divisions).length > 0) return true;
  if (sortedDistinctArenaIndices(divisions).length >= 2) return true;
  if (
    arenaDivisionOrder !== undefined &&
    nextArenaSlotToAdd(divisions, arenaDivisionOrder) !== null
  ) {
    return true;
  }
  return false;
}

/**
 * After moving a group between arenas (DB group.arenaIndex not yet updated),
 * compute the next `arenaDivisionOrder` JSON for both affected arenas.
 */
export function mergeArenaDivisionOrderAfterCrossArenaMove(input: {
  arenaDivisionOrder: unknown;
  divisions: ReadonlyArray<{ id: string; arenaIndex: number }>;
  divisionId: string;
  fromArena: number;
  toArena: number;
  insertIndex: number;
}): Record<string, Array<string>> {
  const {
    arenaDivisionOrder,
    divisions,
    divisionId,
    fromArena,
    toArena,
    insertIndex,
  } = input;
  if (fromArena === toArena) {
    throw new Error(
      'mergeArenaDivisionOrderAfterCrossArenaMove requires fromArena !== toArena'
    );
  }

  const onFromAll = divisions.filter((g) => g.arenaIndex === fromArena);
  const onToAll = divisions.filter((g) => g.arenaIndex === toArena);
  const savedFrom = savedArenaDivisionIds(arenaDivisionOrder, fromArena);
  const savedTo = savedArenaDivisionIds(arenaDivisionOrder, toArena);
  const orderFrom = resolveArenaDivisionOrder(onFromAll, savedFrom).filter(
    (id) => id !== divisionId
  );
  const orderTo = resolveArenaDivisionOrder(onToAll, savedTo);
  const clamped = Math.max(0, Math.min(insertIndex, orderTo.length));
  const nextTo = [
    ...orderTo.slice(0, clamped),
    divisionId,
    ...orderTo.slice(clamped),
  ];

  let json = patchArenaDivisionOrderJson(
    arenaDivisionOrder,
    fromArena,
    orderFrom
  );
  json = patchArenaDivisionOrderJson(json, toArena, nextTo);
  return json;
}

/**
 * Merge all groups from `fromArena` into `toArena` (DB updates applied separately).
 * Clears saved order for `fromArena` and appends moved ids after existing `toArena` order.
 */
export function mergeArenaDivisionOrderAfterRetireArena(input: {
  arenaDivisionOrder: unknown;
  divisions: ReadonlyArray<{ id: string; arenaIndex: number }>;
  fromArena: number;
  toArena: number;
}): Record<string, Array<string>> {
  const { arenaDivisionOrder, divisions, fromArena, toArena } = input;
  if (fromArena === toArena) {
    throw new Error(
      'mergeArenaDivisionOrderAfterRetireArena requires fromArena !== toArena'
    );
  }

  const onFrom = divisions.filter((g) => g.arenaIndex === fromArena);
  const onTo = divisions.filter((g) => g.arenaIndex === toArena);
  const savedFrom = savedArenaDivisionIds(arenaDivisionOrder, fromArena);
  const savedTo = savedArenaDivisionIds(arenaDivisionOrder, toArena);
  const fromOrder = resolveArenaDivisionOrder(onFrom, savedFrom);
  const toOrder = resolveArenaDivisionOrder(onTo, savedTo);
  const nextTo = [...toOrder];
  for (const id of fromOrder) {
    if (!nextTo.includes(id)) nextTo.push(id);
  }

  let json = patchArenaDivisionOrderJson(arenaDivisionOrder, toArena, nextTo);
  json = patchArenaDivisionOrderJson(json, fromArena, []);
  return json;
}
