import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomSlotDb } from '@/lib/tournament/custom-match-slots';
import { resolveCustomSlot } from '@/lib/tournament/custom-match-slots';

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

  it('rejects incomplete feeders', async () => {
    vi.mocked(store.match.findFirst).mockResolvedValue(
      feeder({ status: 'pending' }) as never
    );

    await expect(
      resolveCustomSlot('g1', { mode: 'winner', feederMatchId: 'm1' }, store)
    ).rejects.toThrow(/must be complete/);
  });

  it('rejects custom feeders', async () => {
    vi.mocked(store.match.findFirst).mockResolvedValue(
      feeder({ kind: 'custom' }) as never
    );

    await expect(
      resolveCustomSlot('g1', { mode: 'winner', feederMatchId: 'm1' }, store)
    ).rejects.toThrow(/custom matches cannot be feeders/);
  });

  it('rejects winner ids that do not match a feeder corner', async () => {
    vi.mocked(store.match.findFirst).mockResolvedValue(
      feeder({ tournamentWinnerId: 'ta-other' }) as never
    );

    await expect(
      resolveCustomSlot('g1', { mode: 'loser', feederMatchId: 'm1' }, store)
    ).rejects.toThrow(/Winner does not match/);
  });
});
