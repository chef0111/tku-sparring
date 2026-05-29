import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  generateBracket,
  regenerateBracket,
  resetBracket,
  shuffleBracket,
} from '../bracket/bracket-lifecycle';
import { MatchDAL } from '../dal';
import { buildRound0Baseline } from '../bracket/round0-baseline';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    group: { findUnique: vi.fn(), update: vi.fn() },
    match: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
    tournamentAthlete: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/orpc/activity/dal', () => ({
  recordTournamentActivity: vi.fn(),
}));

vi.mock('@/lib/tournament/tournament-sse-bus', () => ({
  publishMatchInvalidateEvent: vi.fn(),
}));

vi.mock('@/orpc/matches/custom-match-label', () => ({
  assertLabelAvailable: vi.fn().mockResolvedValue(undefined),
}));

const draftGroup = {
  id: 'group-1',
  tournamentId: 't-1',
  thirdPlaceMatch: false,
  tournament: { id: 't-1', status: 'draft' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.group.update).mockResolvedValue({} as never);
  vi.mocked(prisma.$transaction).mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return arg(prisma as never);
    }
    if (Array.isArray(arg)) {
      return Promise.all(
        arg.map((op: unknown) =>
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
    vi.mocked(prisma.match.create).mockImplementation((args) => {
      const data = args.data as { round: number; matchIndex: number };
      return Promise.resolve({
        id: `m-${data.round}-${data.matchIndex}`,
        ...data,
      }) as never;
    });
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await generateBracket({ groupId: 'group-1' }, 'admin-1');

    expect(prisma.match.count).toHaveBeenCalledWith({
      where: { groupId: 'group-1', kind: 'bracket' },
    });

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

  it('does not create third-place match when athletes < 4 even if toggle on', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      ...draftGroup,
      thirdPlaceMatch: true,
    } as never);
    vi.mocked(prisma.match.count).mockResolvedValue(0);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta1', athleteProfileId: 'ap1', beltLevel: 3, weight: 60 },
      { id: 'ta2', athleteProfileId: 'ap2', beltLevel: 3, weight: 62 },
      { id: 'ta3', athleteProfileId: 'ap3', beltLevel: 3, weight: 64 },
    ] as never);
    vi.mocked(prisma.match.create).mockImplementation((args) => {
      const data = args.data as { round: number; matchIndex: number };
      return Promise.resolve({
        id: `m-${data.round}-${data.matchIndex}`,
        ...data,
      }) as never;
    });
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await generateBracket({ groupId: 'group-1' }, 'admin-1');

    const creates = vi
      .mocked(prisma.match.create)
      .mock.calls.map((c) => c[0].data as { round: number });
    expect(creates.some((row) => row.round === 2)).toBe(false);
    expect(creates.length).toBe(3);
  });

  it('creates third-place match when toggle on and athletes >= 4', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      ...draftGroup,
      thirdPlaceMatch: true,
    } as never);
    vi.mocked(prisma.match.count).mockResolvedValue(0);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta1', athleteProfileId: 'ap1', beltLevel: 3, weight: 60 },
      { id: 'ta2', athleteProfileId: 'ap2', beltLevel: 3, weight: 62 },
      { id: 'ta3', athleteProfileId: 'ap3', beltLevel: 3, weight: 64 },
      { id: 'ta4', athleteProfileId: 'ap4', beltLevel: 3, weight: 66 },
    ] as never);
    vi.mocked(prisma.match.create).mockImplementation((args) => {
      const data = args.data as { round: number; matchIndex: number };
      return Promise.resolve({
        id: `m-${data.round}-${data.matchIndex}`,
        ...data,
      }) as never;
    });
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await generateBracket({ groupId: 'group-1' }, 'admin-1');

    const creates = vi
      .mocked(prisma.match.create)
      .mock.calls.map((c) => c[0].data as { round: number });
    expect(creates.filter((row) => row.round === 2)).toHaveLength(1);
    expect(creates.length).toBe(4);
  });
});

describe('resetBracket', () => {
  it('throws when there is no saved shuffle layout', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      ...draftGroup,
      round0Baseline: null,
    } as never);

    await expect(resetBracket('group-1', 'admin-1')).rejects.toThrow(
      /Shuffle once/i
    );
    expect(prisma.match.findMany).not.toHaveBeenCalled();
  });

  it('restores round 0 from baseline and logs bracket.reset', async () => {
    const r0m0 = {
      id: 'm0',
      round: 0,
      matchIndex: 0,
      redLocked: false,
      blueLocked: false,
      redTournamentAthleteId: 'ta-a',
      blueTournamentAthleteId: 'ta-b',
      redAthleteId: 'p1',
      blueAthleteId: 'p2',
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      tournamentWinnerId: null,
      status: 'pending',
    };
    const baseline = buildRound0Baseline([r0m0]);

    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      ...draftGroup,
      round0Baseline: baseline,
    } as never);

    vi.mocked(prisma.match.findMany).mockImplementation(((args) => {
      const w = args?.where as { round?: number; kind?: string } | undefined;
      if (w?.kind === 'bracket' && w.round === undefined) {
        return Promise.resolve([r0m0] as never);
      }
      if (w?.round === 0) {
        return Promise.resolve([r0m0] as never);
      }
      return Promise.resolve([] as never);
    }) as typeof prisma.match.findMany);

    vi.mocked(prisma.match.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta-a', athleteProfileId: 'p1', beltLevel: 4, weight: 65 },
      { id: 'ta-b', athleteProfileId: 'p2', beltLevel: 4, weight: 66 },
    ] as never);
    vi.mocked(prisma.match.update).mockResolvedValue({} as never);
    vi.mocked(prisma.match.findUnique).mockResolvedValue(null);

    await resetBracket('group-1', 'admin-1');

    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'bracket.reset' })
    );
    expect(prisma.match.update).toHaveBeenCalled();
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
      MatchDAL.assignSlot(
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
      MatchDAL.assignSlot(
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
      MatchDAL.swapSlots(
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
      tournamentWinnerId: null,
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
      tournamentWinnerId: null,
      status: 'pending',
    };

    let bracketR0Pass = 0;
    vi.mocked(prisma.match.findMany).mockImplementation(((args) => {
      const w = args?.where as
        | {
            round?: number;
            kind?: string;
            groupId?: string;
          }
        | undefined;
      if (w?.kind === 'bracket' && w.round === undefined) {
        return Promise.resolve([r0m0, r0m1] as never);
      }
      if (w?.kind === 'bracket' && w.round === 0) {
        bracketR0Pass++;
        if (bracketR0Pass === 1) {
          return Promise.resolve([r0m0, r0m1] as never);
        }
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
      if (w?.round === 0 && !w?.kind) {
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
    }) as typeof prisma.match.findMany);

    vi.mocked(prisma.match.updateMany).mockResolvedValue({ count: 0 } as never);

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

  it('places 5 athletes without phantom round-0 and with one contested opening match', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);

    const baseR0 = (i: number) => ({
      id: `r0-${i}`,
      round: 0,
      matchIndex: i,
      redLocked: false,
      blueLocked: false,
      redTournamentAthleteId: null as string | null,
      blueTournamentAthleteId: null as string | null,
      redAthleteId: null as string | null,
      blueAthleteId: null as string | null,
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      tournamentWinnerId: null,
      status: 'pending',
    });
    const r0 = [0, 1, 2, 3].map(baseR0);
    const r1 = [0, 1].map((i) => ({
      id: `r1-${i}`,
      round: 1,
      matchIndex: i,
      redLocked: false,
      blueLocked: false,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
      redAthleteId: null,
      blueAthleteId: null,
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      tournamentWinnerId: null,
      status: 'pending',
    }));
    const r2 = {
      id: 'r2-0',
      round: 2,
      matchIndex: 0,
      redLocked: false,
      blueLocked: false,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
      redAthleteId: null,
      blueAthleteId: null,
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      tournamentWinnerId: null,
      status: 'pending',
    };

    vi.mocked(prisma.match.findMany).mockImplementation(((
      args: Parameters<typeof prisma.match.findMany>[0]
    ) => {
      const w = args?.where as { round?: number } | undefined;
      if (w?.round === 0) {
        return Promise.resolve(r0);
      }
      return Promise.resolve([...r0, ...r1, r2]);
    }) as never);

    vi.mocked(prisma.match.updateMany).mockResolvedValue({ count: 0 } as never);

    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue(
      ['ta1', 'ta2', 'ta3', 'ta4', 'ta5'].map((id, ix) => ({
        id,
        athleteProfileId: `ap${ix + 1}`,
        beltLevel: 3,
        weight: 60,
      })) as never
    );

    vi.mocked(prisma.match.update).mockResolvedValue({} as never);
    vi.mocked(prisma.match.findUnique).mockResolvedValue(null);

    await shuffleBracket('group-1', 'admin');

    const updates = vi.mocked(prisma.match.update).mock.calls.map((c) => c[0]);
    const r0Updates = updates.filter((u) =>
      String(u.where.id).startsWith('r0-')
    );
    const placementR0 = r0Updates.slice(-4);
    expect(placementR0).toHaveLength(4);

    let bothFilled = 0;
    let oneFilled = 0;
    let bothEmpty = 0;
    for (const u of placementR0) {
      const d = u.data as {
        redTournamentAthleteId: string | null;
        blueTournamentAthleteId: string | null;
      };
      const r = d.redTournamentAthleteId != null;
      const b = d.blueTournamentAthleteId != null;
      if (r && b) bothFilled++;
      else if (r !== b) oneFilled++;
      else bothEmpty++;
    }
    expect(bothFilled).toBe(1);
    expect(oneFilled).toBe(3);
    expect(bothEmpty).toBe(0);
  });
});

describe('MatchDAL.adminSetMatchStatus', () => {
  it('downgrades from complete to active and clears wins and winners', async () => {
    const match = {
      id: 'm1',
      status: 'complete',
      redWins: 2,
      blueWins: 0,
      winnerId: 'p-red',
      tournamentWinnerId: 'ta-red',
      tournamentId: 't-1',
      groupId: 'g-1',
      round: 0,
      matchIndex: 0,
    };
    vi.mocked(prisma.match.findUnique).mockResolvedValue(match as never);
    vi.mocked(prisma.match.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.match.update).mockResolvedValue({
      ...match,
      status: 'active',
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      tournamentWinnerId: null,
    } as never);

    await MatchDAL.adminSetMatchStatus(
      { matchId: 'm1', status: 'active' },
      'admin-1'
    );

    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: {
        status: 'active',
        redWins: 0,
        blueWins: 0,
        winnerId: null,
        tournamentWinnerId: null,
      },
    });
    expect(vi.mocked(recordTournamentActivity)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'match.status_admin',
        payload: expect.objectContaining({
          clearedScores: true,
          toStatus: 'active',
        }),
      }),
      expect.anything()
    );
  });

  it('upgrade to complete does not clear scores', async () => {
    const match = {
      id: 'm1',
      status: 'pending',
      redWins: 0,
      blueWins: 0,
      winnerId: null,
      tournamentWinnerId: null,
      tournamentId: 't-1',
      groupId: 'g-1',
      round: 0,
      matchIndex: 0,
    };
    vi.mocked(prisma.match.findUnique).mockResolvedValue(match as never);
    vi.mocked(prisma.match.update).mockResolvedValue({
      ...match,
      status: 'complete',
    } as never);

    await MatchDAL.adminSetMatchStatus(
      { matchId: 'm1', status: 'complete' },
      'admin-1'
    );

    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'complete' },
    });
  });
});

describe('regenerateBracket', () => {
  it('clears all group matches, deletes every match row, then recreates the shell in a transaction', async () => {
    vi.mocked(prisma.group.findUnique).mockResolvedValue(draftGroup as never);
    vi.mocked(prisma.match.updateMany).mockResolvedValue({ count: 4 } as never);
    vi.mocked(prisma.match.deleteMany).mockResolvedValue({ count: 4 } as never);
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { id: 'ta1', athleteProfileId: 'ap1', beltLevel: 3, weight: 60 },
      { id: 'ta2', athleteProfileId: 'ap2', beltLevel: 3, weight: 62 },
    ] as never);
    vi.mocked(prisma.match.create).mockImplementation((args) => {
      const data = args.data as { round: number; matchIndex: number };
      return Promise.resolve({
        id: `m-${data.round}-${data.matchIndex}`,
        ...data,
      }) as never;
    });
    vi.mocked(prisma.match.findMany).mockResolvedValue([]);

    await regenerateBracket('group-1', 'admin-1');

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
    expect(prisma.match.deleteMany).toHaveBeenCalledWith({
      where: { groupId: 'group-1' },
    });
    expect(prisma.match.create).toHaveBeenCalled();
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: 'group-1' },
      data: { round0Baseline: null },
    });
    expect(recordTournamentActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'bracket.regenerate' })
    );
  });
});

describe('updateScore', () => {
  it('advances winner to the next-round slot when match completes 2-0', async () => {
    const completedMatch = {
      id: 'm-r0-0',
      kind: 'bracket',
      groupId: 'group-1',
      tournamentId: 't-1',
      round: 0,
      matchIndex: 0,
      status: 'pending',
      bestOf: 3,
      redWins: 0,
      blueWins: 0,
      redTournamentAthleteId: 'ta-red',
      blueTournamentAthleteId: 'ta-blue',
      redAthleteId: 'ap-red',
      blueAthleteId: 'ap-blue',
      winnerId: null,
      tournamentWinnerId: null,
    };

    vi.mocked(prisma.match.findUnique)
      .mockResolvedValueOnce(completedMatch as never)
      .mockResolvedValueOnce({
        ...completedMatch,
        status: 'complete',
        redWins: 2,
        blueWins: 0,
        winnerId: 'ap-red',
        tournamentWinnerId: 'ta-red',
      } as never);

    vi.mocked(prisma.match.update)
      .mockResolvedValueOnce({
        ...completedMatch,
        status: 'complete',
        redWins: 2,
        blueWins: 0,
        winnerId: 'ap-red',
        tournamentWinnerId: 'ta-red',
      } as never)
      .mockResolvedValueOnce({ id: 'm-r1-0' } as never);

    vi.mocked(prisma.match.findFirst).mockResolvedValue({
      id: 'm-r1-0',
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
    } as never);

    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta-red',
      athleteProfileId: 'ap-red',
    } as never);

    await MatchDAL.updateScore(
      { matchId: 'm-r0-0', redWins: 2, blueWins: 0 },
      'admin-1'
    );

    expect(prisma.match.update).toHaveBeenCalledTimes(2);
    expect(prisma.match.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'm-r1-0' },
      data: {
        redTournamentAthleteId: 'ta-red',
        redAthleteId: 'ap-red',
      },
    });
  });
});

describe('adminSetMatchStatus', () => {
  it('derives winner from existing scores and advances when marking complete', async () => {
    const match = {
      id: 'm-r0-0',
      kind: 'bracket',
      groupId: 'group-1',
      tournamentId: 't-1',
      round: 0,
      matchIndex: 0,
      status: 'active',
      bestOf: 3,
      redWins: 2,
      blueWins: 0,
      redTournamentAthleteId: 'ta-red',
      blueTournamentAthleteId: 'ta-blue',
      redAthleteId: 'ap-red',
      blueAthleteId: 'ap-blue',
      winnerId: null,
      tournamentWinnerId: null,
    };

    vi.mocked(prisma.match.findUnique)
      .mockResolvedValueOnce(match as never)
      .mockResolvedValueOnce({
        ...match,
        status: 'complete',
        winnerId: 'ap-red',
        tournamentWinnerId: 'ta-red',
      } as never);

    vi.mocked(prisma.match.update)
      .mockResolvedValueOnce({
        ...match,
        status: 'complete',
        winnerId: 'ap-red',
        tournamentWinnerId: 'ta-red',
      } as never)
      .mockResolvedValueOnce({ id: 'm-r1-0' } as never);

    vi.mocked(prisma.match.findFirst).mockResolvedValue({
      id: 'm-r1-0',
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
    } as never);

    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta-red',
      athleteProfileId: 'ap-red',
    } as never);

    await MatchDAL.adminSetMatchStatus(
      { matchId: 'm-r0-0', status: 'complete' },
      'admin-1'
    );

    expect(prisma.match.update).toHaveBeenCalledTimes(2);
    expect(prisma.match.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'm-r0-0' },
      data: {
        redWins: 2,
        blueWins: 0,
        winnerId: 'ap-red',
        tournamentWinnerId: 'ta-red',
        status: 'complete',
      },
    });
    expect(prisma.match.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'm-r1-0' },
      data: {
        redTournamentAthleteId: 'ta-red',
        redAthleteId: 'ap-red',
      },
    });
  });
});

describe('createCustom', () => {
  it('creates custom match with direct athletes and notifies realtime', async () => {
    const { publishMatchInvalidateEvent } =
      await import('@/lib/tournament/tournament-sse-bus');
    vi.mocked(prisma.group.findUnique).mockResolvedValue({
      id: 'group-1',
      tournamentId: 't-1',
      tournament: { id: 't-1', status: 'active' },
    } as never);

    vi.mocked(prisma.tournamentAthlete.findFirst)
      .mockResolvedValueOnce({
        id: 'ta-red',
        athleteProfileId: 'ap-r',
        groupId: 'group-1',
      } as never)
      .mockResolvedValueOnce({
        id: 'ta-blue',
        athleteProfileId: 'ap-b',
        groupId: 'group-1',
      } as never);

    vi.mocked(prisma.match.aggregate).mockResolvedValue({
      _max: { matchIndex: null },
    } as never);
    vi.mocked(prisma.match.create).mockResolvedValue({
      id: 'custom-1',
      kind: 'custom',
      displayLabel: 'Exhibition',
      groupId: 'group-1',
      tournamentId: 't-1',
      round: 900,
      matchIndex: 0,
    } as never);

    const row = await MatchDAL.createCustom(
      {
        groupId: 'group-1',
        displayLabel: 'Exhibition',
        red: { mode: 'direct', tournamentAthleteId: 'ta-red' },
        blue: { mode: 'direct', tournamentAthleteId: 'ta-blue' },
      },
      'admin-1'
    );

    expect(row.kind).toBe('custom');
    expect(prisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'custom',
          displayLabel: 'Exhibition',
          redTournamentAthleteId: 'ta-red',
          blueTournamentAthleteId: 'ta-blue',
        }),
      })
    );
    expect(publishMatchInvalidateEvent).toHaveBeenCalledWith('t-1');
  });
});
