import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deviceLastSelectionStore } from '@/server/infrastructure/device-last-selection';
import { getLastSelection } from '@/server/application/device-last-selection/use-cases/get';
import { setLastSelection } from '@/server/application/device-last-selection/use-cases/set';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    deviceLastSelection: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    division: {
      findUnique: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.deviceLastSelection.upsert).mockImplementation(
    (args) => args.create as never
  );
});

describe('getLastSelection', () => {
  it('returns null when no row exists', async () => {
    vi.mocked(prisma.deviceLastSelection.findUnique).mockResolvedValue(null);

    const result = await getLastSelection(
      { userId: 'u1', deviceId: 'd1' },
      deviceLastSelectionStore
    );

    expect(result).toBeNull();
  });

  it('returns stored selection payload', async () => {
    vi.mocked(prisma.deviceLastSelection.findUnique).mockResolvedValue({
      tournamentId: 't1',
      divisionId: 'g1',
      matchId: 'm1',
    } as never);

    const result = await getLastSelection(
      { userId: 'u1', deviceId: 'd1' },
      deviceLastSelectionStore
    );

    expect(result).toEqual({
      tournamentId: 't1',
      divisionId: 'g1',
      matchId: 'm1',
    });
  });
});

describe('setLastSelection', () => {
  it('derives group and tournament from match selection', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      divisionId: 'g1',
      tournamentId: 't1',
    } as never);

    await setLastSelection(
      { userId: 'u1', deviceId: 'd1', matchId: 'm1' },
      deviceLastSelectionStore
    );

    expect(prisma.deviceLastSelection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tournamentId: 't1',
          divisionId: 'g1',
          matchId: 'm1',
        }),
      })
    );
  });

  it('rejects match selections with mismatched group', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      divisionId: 'g1',
      tournamentId: 't1',
    } as never);

    await expect(
      setLastSelection(
        { userId: 'u1', deviceId: 'd1', divisionId: 'g2', matchId: 'm1' },
        deviceLastSelectionStore
      )
    ).rejects.toThrow(/given division/);
  });

  it('rejects match selections with mismatched tournament', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      divisionId: 'g1',
      tournamentId: 't1',
    } as never);

    await expect(
      setLastSelection(
        {
          userId: 'u1',
          deviceId: 'd1',
          tournamentId: 't2',
          matchId: 'm1',
        },
        deviceLastSelectionStore
      )
    ).rejects.toThrow(/given tournament/);
  });

  it('derives tournament from group-only selection', async () => {
    vi.mocked(prisma.division.findUnique).mockResolvedValue({
      tournamentId: 't1',
    } as never);

    await setLastSelection(
      { userId: 'u1', deviceId: 'd1', divisionId: 'g1' },
      deviceLastSelectionStore
    );

    expect(prisma.deviceLastSelection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tournamentId: 't1',
          divisionId: 'g1',
          matchId: null,
        }),
      })
    );
  });
});
