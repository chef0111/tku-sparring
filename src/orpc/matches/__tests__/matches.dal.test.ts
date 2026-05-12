import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assignSlot,
  generateBracket,
  resetBracket,
  shuffleBracket,
  swapSlots,
} from '../matches.dal';
import { recordTournamentActivity } from '@/orpc/activity/tournament-activity.dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    group: { findUnique: vi.fn() },
    match: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tournamentAthlete: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/orpc/activity/tournament-activity.dal', () => ({
  recordTournamentActivity: vi.fn(),
}));

const draftGroup = {
  id: 'group-1',
  tournamentId: 't-1',
  thirdPlaceMatch: false,
  tournament: { id: 't-1', status: 'draft' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (arg) => {
    if (typeof arg === 'function') {
      return arg(prisma as never);
    }
    if (Array.isArray(arg)) {
      return Promise.all(
        arg.map((op) =>
          typeof op === 'object' && op && 'then' in op ? op : op
        )
      );
    }
    return arg;
  });
});

describe('generateBracket', () => {
  it('creates empty shell: all slots null, no bye advancement updates', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);
    vi.mocked(prisma.match.count).mockResolvedValue(0);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta1', athleteProfileId: 'ap1', beltLevel: 3, weight: 60 },
      { id: 'ta2', athleteProfileId: 'ap2', beltLevel: 3, weight: 62 },
    ] as never);
    vi.mocked(prisma.match.create).mockImplementation(
      ({ data }: { data: { round: number; matchIndex: number } }) =>
        Promise.resolve({
          id: `m-${data.round}-${data.matchIndex}`,
          ...data,
        }) as never
    );
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await generateBracket({ groupId: 'group-1' }, 'admin-1');

    const creates = vi
      .mocked(prisma.match.create)
      .mock.calls.map((c) => c[0].data);
    expect(creates.length).toBe(1);
    for (const row of creates) {
      expect(row.redTournamentAthleteId).toBeNull();
      expect(row.blueTournamentAthleteId).toBeNull();
    }
    expect(prisma.match.update).not.toHaveBeenCalled();
    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'bracket.generate',
        payload: expect.objectContaining({ mode: 'shell', bracketSize: 2 }),
      })
    );
  });

  it('rejects when matches already exist', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);
    vi.mocked(prisma.match.count).mockResolvedValue(1);
    await expect(
      generateBracket({ groupId: 'group-1' }, 'admin-1')
    ).rejects.toThrow(/already exist/);
  });
});

describe('resetBracket', () => {
  it('nulls participants and clears locks via updateMany', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);
    vi.mocked(prisma.match.updateMany).mockResolvedValue({ count: 3 } as never);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await resetBracket('group-1', 'admin-1');

    expect(prisma.match.updateMany).toHaveBeenCalledWith({
      where: { groupId: 'group-1' },
      data: expect.objectContaining({
        redTournamentAthleteId: null,
        blueTournamentAthleteId: null,
        redLocked: false,
        blueLocked: false,
        status: 'pending',
      }),
    });
    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'bracket.reset' })
    );
  });
});

describe('assignSlot', () => {
  it('throws when slot is locked', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'm1',
      round: 0,
      redLocked: true,
      groupId: 'group-1',
      group: { tournament: { status: 'draft' } },
    } as never);

    await expect(
      assignSlot(
        { matchId: 'm1', side: 'red', tournamentAthleteId: 'ta1' },
        'admin'
      )
    ).rejects.toThrow(/locked/);
  });

  it('throws when athlete is in another group', async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue({
      id: 'm1',
      round: 0,
      redLocked: false,
      groupId: 'group-1',
      group: { tournament: { status: 'draft' } },
    } as never);
    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta1',
      groupId: 'other',
      athleteProfileId: 'ap1',
    } as never);

    await expect(
      assignSlot(
        { matchId: 'm1', side: 'blue', tournamentAthleteId: 'ta1' },
        'admin'
      )
    ).rejects.toThrow(/does not belong/);
  });
});

describe('swapSlots', () => {
  it('throws when either side is locked', async () => {
    const a = {
      id: 'ma',
      round: 0,
      groupId: 'g1',
      redLocked: true,
      blueLocked: false,
      redTournamentAthleteId: 'ta1',
      blueTournamentAthleteId: null,
      redAthleteId: 'ap1',
      blueAthleteId: null,
      group: { tournament: { status: 'draft' } },
    };
    const b = {
      id: 'mb',
      round: 0,
      groupId: 'g1',
      redLocked: false,
      blueLocked: false,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: 'ta2',
      redAthleteId: null,
      blueAthleteId: 'ap2',
      group: { tournament: { status: 'draft' } },
    };
    vi.mocked(prisma.match.findUnique)
      .mockResolvedValueOnce(a as never)
      .mockResolvedValueOnce(b as never);

    await expect(
      swapSlots(
        {
          matchAId: 'ma',
          sideA: 'red',
          matchBId: 'mb',
          sideB: 'red',
        },
        'admin'
      )
    ).rejects.toThrow(/locked/);
  });
});

describe('shuffleBracket', () => {
  it('throws when no matches', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await expect(shuffleBracket('group-1', 'admin')).rejects.toThrow(
      /Generate a bracket first/
    );
  });

  it('preserves locked red athlete on round 0', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);
    const r0m0 = {
      id: 'm0',
      round: 0,
      matchIndex: 0,
      redLocked: true,
      blueLocked: false,
      redTournamentAthleteId: 'ta-locked',
      blueTournamentAthleteId: null,
      redAthleteId: 'apx',
      blueAthleteId: null,
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      winnerTournamentAthleteId: null,
      status: 'pending',
    };
    const r0m1 = {
      id: 'm0b',
      round: 0,
      matchIndex: 1,
      redLocked: false,
      blueLocked: false,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
      redAthleteId: null,
      blueAthleteId: null,
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      winnerTournamentAthleteId: null,
      status: 'pending',
    };

    let findManyCalls = 0;
    vi.mocked(prisma.match.findMany).mockImplementation((args) => {
      findManyCalls++;
      const w = args?.where as { round?: number } | undefined;
      if (findManyCalls === 1) {
        return Promise.resolve([r0m0, r0m1] as never);
      }
      if (w?.round === 0) {
        return Promise.resolve([
          {
            ...r0m0,
            blueTournamentAthleteId: 'ta-fill',
            blueAthleteId: 'ap-fill',
          },
          {
            ...r0m1,
            redTournamentAthleteId: 'ta-a',
            blueTournamentAthleteId: 'ta-b',
            redAthleteId: 'p2',
            blueAthleteId: 'p3',
          },
        ] as never);
      }
      return Promise.resolve([] as never);
    });

    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta-locked', athleteProfileId: 'p1', beltLevel: 5, weight: 70 },
      { id: 'ta-a', athleteProfileId: 'p2', beltLevel: 4, weight: 65 },
      { id: 'ta-b', athleteProfileId: 'p3', beltLevel: 4, weight: 66 },
    ] as never);

    vi.mocked(prisma.match.update).mockResolvedValue({} as never);
    vi.mocked(prisma.match.findUnique).mockResolvedValue(null);

    await shuffleBracket('group-1', 'admin');

    const updates = vi.mocked(prisma.match.update).mock.calls.map((c) => c[0]);
    const r0Update = updates.find((u) => u.where.id === 'm0');
    expect(r0Update?.data).toMatchObject({
      redTournamentAthleteId: 'ta-locked',
      redAthleteId: 'apx',
    });
  });
});
