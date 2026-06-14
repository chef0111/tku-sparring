import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchDAL } from '../dal';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tournamentAthlete: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/orpc/activity/dal', () => ({
  recordTournamentActivity: vi.fn(),
}));

function upperMatch(over: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    kind: 'bracket',
    round: 1,
    matchIndex: 0,
    status: 'pending',
    redLocked: false,
    blueLocked: false,
    cornersSwapped: false,
    redTournamentAthleteId: 'ta-red',
    blueTournamentAthleteId: null,
    redAthleteId: 'ap-red',
    blueAthleteId: null,
    tournamentId: 't-1',
    groupId: 'g1',
    group: {
      thirdPlaceMatch: false,
      tournament: { status: 'draft' },
    },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') return arg(prisma as never);
    return arg;
  });
  vi.mocked(prisma.match.findMany).mockResolvedValue([
    { id: 'm1', round: 1, matchIndex: 0, kind: 'bracket' },
  ] as never);
  vi.mocked(prisma.match.update).mockImplementation(
    async ({ data }) => ({ ...upperMatch(), ...data }) as never
  );
});

describe('swapParticipants', () => {
  it('toggles cornersSwapped on upper-round matches', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(upperMatch() as never);

    await MatchDAL.swapParticipants(
      {
        matchId: 'm1',
        redTournamentAthleteId: null,
        blueTournamentAthleteId: 'ta-red',
      },
      'admin'
    );

    expect(prisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cornersSwapped: true }),
      })
    );
    expect(recordTournamentActivity).toHaveBeenCalled();
  });

  it('rejects complete matches', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({ status: 'complete' }) as never
    );

    await expect(
      MatchDAL.swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: null,
          blueTournamentAthleteId: 'ta-red',
        },
        'admin'
      )
    ).rejects.toThrow(/complete match/);
  });

  it('rejects locked corners', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({ redLocked: true }) as never
    );

    await expect(
      MatchDAL.swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: null,
          blueTournamentAthleteId: 'ta-red',
        },
        'admin'
      )
    ).rejects.toThrow(/locked/);
  });

  it('rejects round 0', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({ round: 0 }) as never
    );

    await expect(
      MatchDAL.swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: 'ta-blue',
          blueTournamentAthleteId: 'ta-red',
        },
        'admin'
      )
    ).rejects.toThrow(/opening-round/);
  });

  it('rejects third-place match', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({
        id: 'third',
        round: 2,
        matchIndex: 1,
        group: {
          thirdPlaceMatch: true,
          tournament: { status: 'draft' },
        },
      }) as never
    );
    vi.mocked(prisma.match.findMany).mockResolvedValue([
      { id: 'f', round: 2, matchIndex: 0, kind: 'bracket' },
      { id: 'third', round: 2, matchIndex: 1, kind: 'bracket' },
    ] as never);

    await expect(
      MatchDAL.swapParticipants(
        {
          matchId: 'third',
          redTournamentAthleteId: 'ta-a',
          blueTournamentAthleteId: 'ta-b',
        },
        'admin'
      )
    ).rejects.toThrow(/third-place/);
  });

  it('rejects non-transpose payloads', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(upperMatch() as never);

    await expect(
      MatchDAL.swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: 'ta-red',
          blueTournamentAthleteId: null,
        },
        'admin'
      )
    ).rejects.toThrow(/transpose/);
  });
});
