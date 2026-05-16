import { completedRoundsFromWins } from '@/lib/tournament/bo3';
import { useTimerStore } from '@/stores/timer-store';

/** Legacy single-key storage (pre per-matchId keys); read for migration only. */
export const LEGACY_ARENA_COMBAT_SNAPSHOT_STORAGE_KEY =
  'tku-arena-combat-snapshot';

/** Current on-disk schema (includes round / break timer fields). */
export const ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION = 2 as const;

export type ArenaCombatSideSnapshot = {
  health: number;
  mana: number;
  fouls: number;
};

export type ArenaTimerSnapshot = {
  timeLeftMs: number;
  breakTimeLeftMs: number;
  isBreakTime: boolean;
  roundStarted: boolean;
  roundEnded: boolean;
  isRunning: boolean;
};

export type ArenaCombatSnapshotV1 = {
  schemaVersion: 1;
  matchId: string;
  completedRounds: number;
  red: ArenaCombatSideSnapshot;
  blue: ArenaCombatSideSnapshot;
};

export type ArenaCombatSnapshotV2 = {
  schemaVersion: typeof ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION;
  matchId: string;
  completedRounds: number;
  red: ArenaCombatSideSnapshot;
  blue: ArenaCombatSideSnapshot;
  timer: ArenaTimerSnapshot;
};

export type ArenaCombatPersistedSnapshot =
  | ArenaCombatSnapshotV1
  | ArenaCombatSnapshotV2;

const isSide = (v: unknown): v is ArenaCombatSideSnapshot =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as ArenaCombatSideSnapshot).health === 'number' &&
  typeof (v as ArenaCombatSideSnapshot).mana === 'number' &&
  typeof (v as ArenaCombatSideSnapshot).fouls === 'number';

const isTimer = (v: unknown): v is ArenaTimerSnapshot =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as ArenaTimerSnapshot).timeLeftMs === 'number' &&
  typeof (v as ArenaTimerSnapshot).breakTimeLeftMs === 'number' &&
  typeof (v as ArenaTimerSnapshot).isBreakTime === 'boolean' &&
  typeof (v as ArenaTimerSnapshot).roundStarted === 'boolean' &&
  typeof (v as ArenaTimerSnapshot).roundEnded === 'boolean' &&
  typeof (v as ArenaTimerSnapshot).isRunning === 'boolean';

export function isLikelyMongoObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/** localStorage key scoped to a match (ObjectId-safe suffix). */
export function arenaCombatSnapshotStorageKey(matchId: string): string {
  return `${LEGACY_ARENA_COMBAT_SNAPSHOT_STORAGE_KEY}:${matchId}`;
}

function parseSidesAndMeta(
  o: Record<string, unknown>
): Omit<ArenaCombatSnapshotV1, 'schemaVersion'> | null {
  if (typeof o.matchId !== 'string' || !isLikelyMongoObjectId(o.matchId)) {
    return null;
  }
  if (typeof o.completedRounds !== 'number' || o.completedRounds < 0) {
    return null;
  }
  if (!isSide(o.red) || !isSide(o.blue)) return null;
  return {
    matchId: o.matchId,
    completedRounds: o.completedRounds,
    red: o.red,
    blue: o.blue,
  };
}

function parseV1Body(o: Record<string, unknown>): ArenaCombatSnapshotV1 | null {
  const m = parseSidesAndMeta(o);
  if (!m) return null;
  return { schemaVersion: 1, ...m };
}

function parseV2Body(o: Record<string, unknown>): ArenaCombatSnapshotV2 | null {
  const m = parseSidesAndMeta(o);
  if (!m || !isTimer(o.timer)) return null;
  return {
    schemaVersion: ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION,
    ...m,
    timer: o.timer,
  };
}

export function parseArenaCombatSnapshot(
  raw: string | null
): ArenaCombatPersistedSnapshot | null {
  if (raw == null || raw === '') return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return null;
    const o = v as Record<string, unknown>;
    const ver = o.schemaVersion;
    if (ver === ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION) {
      return parseV2Body(o);
    }
    if (ver === 1) {
      return parseV1Body(o);
    }
    return null;
  } catch {
    return null;
  }
}

export function snapshotMatchesCompletedRounds(
  snap: ArenaCombatPersistedSnapshot,
  serverRedWins: number,
  serverBlueWins: number
): boolean {
  return (
    snap.completedRounds ===
    completedRoundsFromWins(serverRedWins, serverBlueWins)
  );
}

export function readArenaCombatSnapshotForMatch(
  matchId: string
): ArenaCombatPersistedSnapshot | null {
  if (typeof window === 'undefined' || !isLikelyMongoObjectId(matchId)) {
    return null;
  }
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(arenaCombatSnapshotStorageKey(matchId));
  } catch {
    raw = null;
  }
  const scoped = parseArenaCombatSnapshot(raw);
  if (scoped) return scoped;

  try {
    raw = window.localStorage.getItem(LEGACY_ARENA_COMBAT_SNAPSHOT_STORAGE_KEY);
  } catch {
    raw = null;
  }
  const legacy = parseArenaCombatSnapshot(raw);
  if (!legacy || legacy.matchId !== matchId) return null;

  try {
    window.localStorage.setItem(
      arenaCombatSnapshotStorageKey(matchId),
      JSON.stringify(legacy)
    );
    window.localStorage.removeItem(LEGACY_ARENA_COMBAT_SNAPSHOT_STORAGE_KEY);
  } catch {
    // ignore migration failures
  }
  return legacy;
}

export function clearArenaCombatSnapshotForMatch(matchId: string): void {
  if (typeof window === 'undefined' || !isLikelyMongoObjectId(matchId)) return;
  try {
    window.localStorage.removeItem(arenaCombatSnapshotStorageKey(matchId));
  } catch {
    // ignore
  }
}

export function saveArenaCombatSnapshot(
  matchId: string,
  snapshot: ArenaCombatSnapshotV2
): void {
  if (typeof window === 'undefined') return;
  if (!isLikelyMongoObjectId(matchId) || snapshot.matchId !== matchId) return;
  if (snapshot.schemaVersion !== ARENA_COMBAT_SNAPSHOT_SCHEMA_VERSION) return;
  try {
    window.localStorage.setItem(
      arenaCombatSnapshotStorageKey(matchId),
      JSON.stringify(snapshot)
    );
  } catch {
    // ignore
  }
}

/**
 * Restores round/break clocks from a v2 snapshot. Always clears `isRunning`
 * so a reload does not auto-start the clock.
 */
export function applyPersistedArenaTimerState(
  timer: ArenaTimerSnapshot,
  settingsRoundDurationMs: number
): void {
  const ts = useTimerStore.getState();
  const roundCap = Math.max(
    0,
    Math.min(Math.max(1, settingsRoundDurationMs), ts.roundDuration)
  );
  const timeLeft = Math.max(0, Math.min(timer.timeLeftMs, roundCap));
  const breakCap = Math.max(0, ts.breakDuration);
  const breakTimeLeft = Math.max(0, Math.min(timer.breakTimeLeftMs, breakCap));

  useTimerStore.setState({
    timeLeft,
    breakTimeLeft,
    isBreakTime: timer.isBreakTime,
    roundStarted: timer.roundStarted,
    roundEnded: timer.roundEnded,
    isRunning: false,
  });
}
