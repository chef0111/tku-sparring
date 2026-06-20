import { describe, expect, it, vi } from 'vitest';

import { loadMatchLabelContext } from '@/server/infrastructure/tournament/match-label-context';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    tournament: { findUnique: vi.fn() },
    match: { findMany: vi.fn() },
    tournamentAthlete: { groupBy: vi.fn() },
  },
}));

describe('loadMatchLabelContext', () => {
  it('builds arena match numbers and assigned bracket title keys', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      arenaDivisionOrder: null,
      divisions: [
        { id: 'g1', arenaIndex: 1, thirdPlaceMatch: false },
        { id: 'g2', arenaIndex: 1, thirdPlaceMatch: false },
      ],
    } as never);

    vi.mocked(prisma.match.findMany).mockResolvedValue([
      {
        id: 'm1',
        kind: 'bracket',
        divisionId: 'g1',
        round: 0,
        matchIndex: 0,
        displayLabel: null,
        status: 'pending',
        redTournamentAthleteId: 'ta1',
        blueTournamentAthleteId: 'ta2',
        redAthleteId: 'ap1',
        blueAthleteId: 'ap2',
        redWins: 0,
        blueWins: 0,
        winnerId: null,
        tournamentWinnerId: null,
        redLocked: false,
        blueLocked: false,
        tournamentId: 't1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    vi.mocked(prisma.tournamentAthlete.groupBy).mockResolvedValue([
      { divisionId: 'g1', _count: { _all: 2 } },
      { divisionId: 'g2', _count: { _all: 2 } },
    ] as never);

    const ctx = await loadMatchLabelContext({
      tournamentId: 't1',
      divisionId: 'g1',
    });

    expect(ctx.arenaIndex).toBe(1);
    expect(ctx.divisionIdsOnArena).toEqual(['g1', 'g2']);
    expect(ctx.numbers.get('m1')).toBe(101);
    expect(ctx.assignedBracketTitleKeys.has('match 101')).toBe(true);
  });
});
