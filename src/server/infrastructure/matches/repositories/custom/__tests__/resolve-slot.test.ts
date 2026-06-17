import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveCustomSlot } from 'src/server/infrastructure/matches/repositories/custom/resolve-slot';
import type { CustomSlotDb } from 'src/server/infrastructure/matches/repositories/custom/resolve-slot';

function feeder(over: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    kind: 'bracket',
    status: 'complete',
    redTournamentAthleteId: 'ta-red',
    blueTournamentAthleteId: 'ta-blue',
    tournamentWinnerId: 'ta-red',
    ...over,
  };
}

function db(): CustomSlotDb {
  return {
    match: {
      findFirst: vi.fn(),
    },
    tournamentAthlete: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  } as never;
}

describe('resolveCustomSlot', () => {
  let store: CustomSlotDb;

  beforeEach(() => {
    store = db();
  });

  it('resolves direct athlete slots', async () => {
    vi.mocked(store.tournamentAthlete.findFirst).mockResolvedValue({
      id: 'ta-direct',
      athleteProfileId: 'ap-direct',
    } as never);

    await expect(
      resolveCustomSlot(
        'g1',
        { mode: 'direct', tournamentAthleteId: 'ta-direct' },
        store
      )
    ).resolves.toEqual({
      tournamentAthleteId: 'ta-direct',
      athleteProfileId: 'ap-direct',
    });
  });

  it('rejects direct athlete missing from group', async () => {
    vi.mocked(store.tournamentAthlete.findFirst).mockResolvedValue(null);

    await expect(
      resolveCustomSlot(
        'g1',
        { mode: 'direct', tournamentAthleteId: 'ta-direct' },
        store
      )
    ).rejects.toThrow(/not found in this group/);
  });

  it('rejects feeder match missing from group', async () => {
    vi.mocked(store.match.findFirst).mockResolvedValue(null);

    await expect(
      resolveCustomSlot('g1', { mode: 'winner', feederMatchId: 'm1' }, store)
    ).rejects.toThrow(/not found in this group/);
  });

  it('resolves winner feeder slots', async () => {
    vi.mocked(store.match.findFirst).mockResolvedValue(feeder() as never);
    vi.mocked(store.tournamentAthlete.findUnique).mockResolvedValue({
      athleteProfileId: 'ap-red',
    } as never);

    await expect(
      resolveCustomSlot('g1', { mode: 'winner', feederMatchId: 'm1' }, store)
    ).resolves.toEqual({
      tournamentAthleteId: 'ta-red',
      athleteProfileId: 'ap-red',
    });
  });

  it('resolves loser feeder slots', async () => {
    vi.mocked(store.match.findFirst).mockResolvedValue(feeder() as never);
    vi.mocked(store.tournamentAthlete.findUnique).mockResolvedValue({
      athleteProfileId: 'ap-blue',
    } as never);

    await expect(
      resolveCustomSlot('g1', { mode: 'loser', feederMatchId: 'm1' }, store)
    ).resolves.toEqual({
      tournamentAthleteId: 'ta-blue',
      athleteProfileId: 'ap-blue',
    });
  });
});
