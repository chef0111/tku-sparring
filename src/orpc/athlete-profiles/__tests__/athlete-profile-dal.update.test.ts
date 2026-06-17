import { beforeEach, describe, expect, it, vi } from 'vitest';

import { athleteProfileStore } from '@/server/infrastructure/athlete-profiles';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('athleteProfileStore.update', () => {
  it('propagates image to all tournament athletes for that profile', async () => {
    const profileUpdate = vi.fn().mockResolvedValue({
      id: 'prof1',
      image: 'https://cdn.example/a.png',
    });
    const tournamentUpdateMany = vi.fn().mockResolvedValue({ count: 2 });

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        athleteProfile: { update: profileUpdate },
        tournamentAthlete: { updateMany: tournamentUpdateMany },
      };
      return (fn as unknown as (t: typeof tx) => Promise<unknown>)(tx);
    });

    await athleteProfileStore.update('prof1', {
      athleteCode: '001',
      image: 'https://cdn.example/a.png',
    });

    expect(profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prof1' },
        data: expect.objectContaining({
          image: 'https://cdn.example/a.png',
        }),
      })
    );
    expect(tournamentUpdateMany).toHaveBeenCalledWith({
      where: { athleteProfileId: 'prof1' },
      data: { image: 'https://cdn.example/a.png' },
    });
  });

  it('does not touch tournament athletes when image is omitted', async () => {
    const profileUpdate = vi.fn().mockResolvedValue({ id: 'prof1', name: 'X' });
    const tournamentUpdateMany = vi.fn();

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        athleteProfile: { update: profileUpdate },
        tournamentAthlete: { updateMany: tournamentUpdateMany },
      };
      return (fn as unknown as (t: typeof tx) => Promise<unknown>)(tx);
    });

    await athleteProfileStore.update('prof1', {
      athleteCode: '001',
      name: 'New Name',
      image: undefined,
    });

    expect(tournamentUpdateMany).not.toHaveBeenCalled();
  });
});
