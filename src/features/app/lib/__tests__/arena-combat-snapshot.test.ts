import { describe, expect, it } from 'vitest';

import {
  arenaCombatSnapshotStorageKey,
  parseArenaCombatSnapshot,
  snapshotMatchesCompletedRounds,
} from '../arena-combat-snapshot';

describe('arena-combat-snapshot', () => {
  it('scopes storage keys by matchId', () => {
    const id = '507f1f77bcf86cd799439011';
    expect(arenaCombatSnapshotStorageKey(id)).toBe(
      `tku-arena-combat-snapshot:${id}`
    );
  });
  it('rejects invalid JSON', () => {
    expect(parseArenaCombatSnapshot('not json')).toBeNull();
  });

  it('accepts a valid v2 snapshot with timer', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      matchId: '507f1f77bcf86cd799439011',
      completedRounds: 0,
      red: { health: 100, mana: 5, fouls: 0 },
      blue: { health: 100, mana: 5, fouls: 0 },
      timer: {
        timeLeftMs: 45000,
        breakTimeLeftMs: 30000,
        isBreakTime: false,
        roundStarted: true,
        roundEnded: false,
        isRunning: true,
      },
    });
    const snap = parseArenaCombatSnapshot(raw);
    expect(snap?.schemaVersion).toBe(2);
    if (snap && snap.schemaVersion === 2) {
      expect(snap.timer.timeLeftMs).toBe(45000);
    }
  });

  it('accepts a valid v1 snapshot', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      matchId: '507f1f77bcf86cd799439011',
      completedRounds: 1,
      red: { health: 100, mana: 4, fouls: 0 },
      blue: { health: 90, mana: 5, fouls: 1 },
    });
    const snap = parseArenaCombatSnapshot(raw);
    expect(snap).not.toBeNull();
    expect(snap!.matchId).toBe('507f1f77bcf86cd799439011');
  });

  it('rejects non-ObjectId match ids', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      matchId: 'not-an-id',
      completedRounds: 0,
      red: { health: 1, mana: 1, fouls: 0 },
      blue: { health: 1, mana: 1, fouls: 0 },
    });
    expect(parseArenaCombatSnapshot(raw)).toBeNull();
  });

  it('snapshotMatchesCompletedRounds guards staleness', () => {
    const snap = {
      schemaVersion: 1 as const,
      matchId: '507f1f77bcf86cd799439011',
      completedRounds: 1,
      red: { health: 10, mana: 5, fouls: 0 },
      blue: { health: 10, mana: 5, fouls: 0 },
    };
    expect(snapshotMatchesCompletedRounds(snap, 1, 0)).toBe(true);
    expect(snapshotMatchesCompletedRounds(snap, 0, 0)).toBe(false);
    expect(snapshotMatchesCompletedRounds(snap, 2, 0)).toBe(false);
  });
});
