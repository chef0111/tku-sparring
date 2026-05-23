import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AthleteProfileDAL } from '../dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    athleteProfile: { findMany: vi.fn(), count: vi.fn() },
  },
}));

describe('AthleteProfileDAL.findMany excludeTournamentId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('excludes profiles already registered in the tournament', async () => {
    (
      prisma.athleteProfile.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (prisma.athleteProfile.count as ReturnType<typeof vi.fn>).mockResolvedValue(
      0
    );

    await AthleteProfileDAL.findMany({
      page: 1,
      perPage: 20,
      excludeTournamentId: 'tournament-1',
      filters: [],
      joinOperator: 'and',
      sorting: [],
    });

    expect(prisma.athleteProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {},
            {
              NOT: {
                tournamentAthletes: {
                  some: { tournamentId: 'tournament-1' },
                },
              },
            },
          ],
        },
      })
    );
  });
});
