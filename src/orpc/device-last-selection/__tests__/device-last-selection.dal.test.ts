import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeviceLastSelectionDAL } from '../dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    deviceLastSelection: {
      upsert: vi.fn(),
    },
    group: {
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

describe('DeviceLastSelectionDAL.upsertForUserDevice', () => {
  it('derives group and tournament from match selection', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      groupId: 'g1',
      tournamentId: 't1',
    } as never);

    await DeviceLastSelectionDAL.upsertForUserDevice('u1', {
      deviceId: 'd1',
      matchId: 'm1',
    });

    expect(prisma.deviceLastSelection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tournamentId: 't1',
          groupId: 'g1',
          matchId: 'm1',
        }),
      })
    );
  });

  it('rejects match selections with mismatched group', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      groupId: 'g1',
      tournamentId: 't1',
    } as never);

    await expect(
      DeviceLastSelectionDAL.upsertForUserDevice('u1', {
        deviceId: 'd1',
        groupId: 'g2',
        matchId: 'm1',
      })
    ).rejects.toThrow(/given group/);
  });

  it('rejects match selections with mismatched tournament', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      groupId: 'g1',
      tournamentId: 't1',
    } as never);

    await expect(
      DeviceLastSelectionDAL.upsertForUserDevice('u1', {
        deviceId: 'd1',
        tournamentId: 't2',
        matchId: 'm1',
      })
    ).rejects.toThrow(/given tournament/);
  });

  it('derives tournament from group-only selection', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      tournamentId: 't1',
    } as never);

    await DeviceLastSelectionDAL.upsertForUserDevice('u1', {
      deviceId: 'd1',
      groupId: 'g1',
    });

    expect(prisma.deviceLastSelection.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tournamentId: 't1',
          groupId: 'g1',
          matchId: null,
        }),
      })
    );
  });
});
