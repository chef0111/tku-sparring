import { beforeEach, describe, expect, it, vi } from 'vitest';

import { swapParticipants } from '@/server/application/matches/use-cases/swap-participants';
import { matchParticipantStore } from '@/server/infrastructure/matches/repositories/swap-participants';
import { recordMutationActivity } from '@/server/infrastructure/mutation-effects';
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

vi.mock('@/server/infrastructure/mutation-effects', () => ({
  recordMutationActivity: vi.fn(),
  publishTournamentMutation: vi.fn(),
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
    tournament: { status: 'draft' },
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
    ({ data }) => ({ ...upperMatch(), ...data }) as never
  );
});

describe('swapParticipants', () => {
  it('toggles cornersSwapped on upper-round matches', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(upperMatch() as never);

    await swapParticipants(
      {
        matchId: 'm1',
        redTournamentAthleteId: null,
        blueTournamentAthleteId: 'ta-red',
        adminId: 'admin',
      },
      matchParticipantStore
    );

    expect(prisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cornersSwapped: true }),
      })
    );
    expect(recordMutationActivity).toHaveBeenCalled();
  });

  it('rejects complete matches', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({ status: 'complete' }) as never
    );

    await expect(
      swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: null,
          blueTournamentAthleteId: 'ta-red',
          adminId: 'admin',
        },
        matchParticipantStore
      )
    ).rejects.toThrow(/complete match/);
  });

  it('rejects locked corners', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({ redLocked: true }) as never
    );

    await expect(
      swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: null,
          blueTournamentAthleteId: 'ta-red',
          adminId: 'admin',
        },
        matchParticipantStore
      )
    ).rejects.toThrow(/locked/);
  });

  it('rejects round 0', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({ round: 0 }) as never
    );

    await expect(
      swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: 'ta-blue',
          blueTournamentAthleteId: 'ta-red',
          adminId: 'admin',
        },
        matchParticipantStore
      )
    ).rejects.toThrow(/opening-round/);
  });

  it('rejects third-place match', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(
      upperMatch({
        id: 'third',
        round: 2,
        matchIndex: 1,
        tournament: { status: 'draft' },
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
      swapParticipants(
        {
          matchId: 'third',
          redTournamentAthleteId: 'ta-a',
          blueTournamentAthleteId: 'ta-b',
          adminId: 'admin',
        },
        matchParticipantStore
      )
    ).rejects.toThrow(/third-place/);
  });

  it('rejects non-transpose payloads', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(upperMatch() as never);

    await expect(
      swapParticipants(
        {
          matchId: 'm1',
          redTournamentAthleteId: 'ta-red',
          blueTournamentAthleteId: null,
          adminId: 'admin',
        },
        matchParticipantStore
      )
    ).rejects.toThrow(/transpose/);
  });
});
