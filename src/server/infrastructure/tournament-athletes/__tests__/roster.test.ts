import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tournamentAthleteStore } from '@/server/infrastructure/tournament-athletes';
import { prisma } from '@/lib/db';
import { publishTournamentMutation } from '@/server/infrastructure/mutation-effects';

vi.mock('@/lib/db', () => ({
  prisma: {
    tournamentAthlete: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
    },
    athleteProfile: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/server/infrastructure/mutation-effects', () => ({
  publishTournamentMutation: vi.fn(),
  recordMutationActivity: vi.fn(),
}));

const profile = (id: string, image: string | null = null) => ({
  id,
  name: `Athlete ${id}`,
  gender: 'M',
  beltLevel: 3,
  weight: 55,
  affiliation: 'Club A',
  image,
});

describe('bulkCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'draft',
    } as never);
  });

  it('creates tournament athletes with snapshot fields', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 2,
    });

    const profiles = [profile('p1'), profile('p2')];
    const result = await tournamentAthleteStore.bulkCreate(
      'tournament-1',
      profiles
    );

    expect(prisma.tournamentAthlete.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          tournamentId: 'tournament-1',
          athleteProfileId: 'p1',
          name: 'Athlete p1',
          nameSortKey: 'p1',
          gender: 'M',
          beltLevel: 3,
          weight: 55,
          affiliation: 'Club A',
          image: null,
          status: 'selected',
        }),
      ]),
    });

    expect(result).toHaveLength(2);
    expect(publishTournamentMutation).toHaveBeenCalledWith('tournament-1');
  });

  it('copies profile image URL into snapshot', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 1,
    });

    const url = 'https://example.com/a.png';
    const profiles = [profile('p1', url)];
    await tournamentAthleteStore.bulkCreate('tournament-1', profiles);

    expect(prisma.tournamentAthlete.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          athleteProfileId: 'p1',
          image: url,
        }),
      ],
    });
  });

  it('skips athletes already in the tournament', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { athleteProfileId: 'p1' } as never,
    ]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 1,
    });

    const profiles = [profile('p1'), profile('p2')];
    const result = await tournamentAthleteStore.bulkCreate(
      'tournament-1',
      profiles
    );

    const callArgs = vi.mocked(prisma.tournamentAthlete.createMany).mock
      .calls[0]?.[0];
    const data = Array.isArray(callArgs?.data) ? callArgs.data : [];
    expect(data).toHaveLength(1);
    expect(data[0]?.athleteProfileId).toBe('p2');
    expect(result).toHaveLength(1);
  });

  it('returns empty array when all athletes already in tournament', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { athleteProfileId: 'p1' } as never,
      { athleteProfileId: 'p2' } as never,
    ]);

    const profiles = [profile('p1'), profile('p2')];
    const result = await tournamentAthleteStore.bulkCreate(
      'tournament-1',
      profiles
    );

    expect(prisma.tournamentAthlete.createMany).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
    expect(publishTournamentMutation).not.toHaveBeenCalled();
  });

  it('rejects active tournaments', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'active',
    } as never);

    await expect(
      tournamentAthleteStore.bulkCreate('tournament-1', [profile('p1')])
    ).rejects.toThrow(/Draft status/);

    expect(prisma.tournamentAthlete.createMany).not.toHaveBeenCalled();
  });

  it('rejects completed tournaments', async () => {
    vi.mocked(prisma.tournament.findUnique).mockResolvedValue({
      status: 'completed',
    } as never);

    await expect(
      tournamentAthleteStore.bulkCreate('tournament-1', [profile('p1')])
    ).rejects.toThrow(/read-only/);

    expect(prisma.tournamentAthlete.createMany).not.toHaveBeenCalled();
  });
});

describe('tournament athlete writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates draft tournament athletes and publishes', async () => {
    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      tournament: { status: 'draft' },
    } as never);
    vi.mocked(prisma.tournamentAthlete.update).mockResolvedValue({
      id: 'ta1',
      tournamentId: 't1',
      seed: 1,
      athleteProfile: { id: 'p1', athleteCode: null },
    } as never);

    await tournamentAthleteStore.update({ id: 'ta1', seed: 1 });

    expect(prisma.tournamentAthlete.update).toHaveBeenCalledWith({
      where: { id: 'ta1' },
      data: { seed: 1 },
      include: {
        athleteProfile: { select: { id: true, athleteCode: true } },
      },
    });
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects updates in active tournaments', async () => {
    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta1',
      tournament: { status: 'active' },
    } as never);

    await expect(
      tournamentAthleteStore.update({ id: 'ta1', seed: 1 })
    ).rejects.toThrow(/Draft status/);

    expect(prisma.tournamentAthlete.update).not.toHaveBeenCalled();
  });

  it('rejects removes in completed tournaments', async () => {
    vi.mocked(prisma.tournamentAthlete.findUnique).mockResolvedValue({
      id: 'ta1',
      tournament: { status: 'completed' },
    } as never);

    await expect(tournamentAthleteStore.remove({ id: 'ta1' })).rejects.toThrow(
      /read-only/
    );

    expect(prisma.tournamentAthlete.delete).not.toHaveBeenCalled();
  });

  it('bulk removes draft tournament athletes and publishes once per tournament', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { tournamentId: 't1', tournament: { status: 'draft' } },
      { tournamentId: 't1', tournament: { status: 'draft' } },
    ] as never);
    vi.mocked(prisma.tournamentAthlete.deleteMany).mockResolvedValue({
      count: 2,
    } as never);

    const result = await tournamentAthleteStore.bulkRemove({
      ids: ['ta1', 'ta2'],
    });

    expect(result).toEqual({ removed: 2 });
    expect(publishTournamentMutation).toHaveBeenCalledTimes(1);
    expect(publishTournamentMutation).toHaveBeenCalledWith('t1');
  });

  it('rejects bulk removes in active tournaments', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { tournamentId: 't1', tournament: { status: 'active' } },
    ] as never);

    await expect(
      tournamentAthleteStore.bulkRemove({ ids: ['ta1'] })
    ).rejects.toThrow(/Draft status/);

    expect(prisma.tournamentAthlete.deleteMany).not.toHaveBeenCalled();
  });
});

describe('list', () => {
  type ListInput = Parameters<typeof tournamentAthleteStore.list>[0];

  const baseInput: ListInput = {
    tournamentId: 'tournament-1',
    unassignedOnly: false,
    page: 1,
    perPage: 30,
    sorting: [],
  };

  function mockResult(items: Array<unknown>, total: number) {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue(
      items as never
    );
    vi.mocked(prisma.tournamentAthlete.count).mockResolvedValue(total as never);
  }

  function getFindManyArgs() {
    return vi.mocked(prisma.tournamentAthlete.findMany).mock.calls[0]?.[0];
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters unassigned athletes when unassignedOnly is true', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      unassignedOnly: true,
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      tournamentId: 'tournament-1',
      AND: [{ groupId: null }],
    });
  });

  it('filters by groupId when provided and unassignedOnly is false', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      groupId: 'group-1',
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      tournamentId: 'tournament-1',
      AND: [{ groupId: 'group-1' }],
    });
  });

  it('prefers unassignedOnly over groupId when both are set', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      unassignedOnly: true,
      groupId: 'group-1',
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      AND: [{ groupId: null }],
    });
  });

  it('combines unassignedOnly with query filter (AND, not overwriting OR)', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      unassignedOnly: true,
      query: 'lee',
    });

    const args = getFindManyArgs();
    const andClauses = args?.where?.AND;
    expect(Array.isArray(andClauses)).toBe(true);
    if (!Array.isArray(andClauses)) throw new Error('expected AND array');
    expect(andClauses).toHaveLength(2);
    expect(andClauses[0]).toMatchObject({ groupId: null });
    expect(andClauses[1]).toMatchObject({
      OR: [
        { name: { contains: 'lee', mode: 'insensitive' } },
        { affiliation: { contains: 'lee', mode: 'insensitive' } },
      ],
    });
  });

  it('builds case-insensitive OR query for name and affiliation', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      query: 'john',
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      tournamentId: 'tournament-1',
      AND: [
        {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { affiliation: { contains: 'john', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('filters by gender using `in`', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      gender: ['M'],
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ gender: { in: ['M'] } });
  });

  it('uses beltLevel `in` when beltLevels is provided', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      beltLevels: [1, 3, 5],
      beltLevelMin: 0,
      beltLevelMax: 10,
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ beltLevel: { in: [1, 3, 5] } });
  });

  it('uses beltLevel gte/lte when only min/max are provided', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      beltLevelMin: 2,
      beltLevelMax: 6,
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ beltLevel: { gte: 2, lte: 6 } });
  });

  it('filters weight by gte/lte when provided', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      weightMin: 50,
      weightMax: 70,
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ weight: { gte: 50, lte: 70 } });
  });

  it('honors sorting by mapping {id, desc} to prisma orderBy', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list({
      ...baseInput,
      sorting: [
        { id: 'name', desc: false },
        { id: 'weight', desc: true },
      ],
    });

    const args = getFindManyArgs();
    expect(args?.orderBy).toEqual([{ nameSortKey: 'asc' }, { weight: 'desc' }]);
  });

  it('defaults to createdAt asc when sorting is empty', async () => {
    mockResult([], 0);
    await tournamentAthleteStore.list(baseInput);

    const args = getFindManyArgs();
    expect(args?.orderBy).toEqual([{ createdAt: 'asc' }]);
  });

  it('paginates using page/perPage and returns { items, total }', async () => {
    const items = [{ id: 'a1' }, { id: 'a2' }];
    mockResult(items, 42);

    const result = await tournamentAthleteStore.list({
      ...baseInput,
      page: 3,
      perPage: 10,
    });

    const args = getFindManyArgs();
    expect(args?.skip).toBe(20);
    expect(args?.take).toBe(10);
    expect(result).toEqual({ items, total: 42 });
  });
});
