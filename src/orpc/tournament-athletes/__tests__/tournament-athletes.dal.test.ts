import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bulkCreate, findByTournamentId } from '../tournament-athletes.dal';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    tournamentAthlete: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    athleteProfile: {
      findMany: vi.fn(),
    },
  },
}));

const profile = (id: string) => ({
  id,
  name: `Athlete ${id}`,
  gender: 'M',
  beltLevel: 3,
  weight: 55,
  affiliation: 'Club A',
});

describe('bulkCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates tournament athletes with snapshot fields', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 2,
    });

    const profiles = [profile('p1'), profile('p2')];
    const result = await bulkCreate('tournament-1', profiles);

    expect(prisma.tournamentAthlete.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          tournamentId: 'tournament-1',
          athleteProfileId: 'p1',
          name: 'Athlete p1',
          gender: 'M',
          beltLevel: 3,
          weight: 55,
          affiliation: 'Club A',
          status: 'selected',
        }),
      ]),
    });

    expect(result).toHaveLength(2);
  });

  it('skips athletes already in the tournament', async () => {
    vi.mocked(prisma.tournamentAthlete.findMany).mockResolvedValue([
      { athleteProfileId: 'p1' } as never,
    ]);
    vi.mocked(prisma.tournamentAthlete.createMany).mockResolvedValue({
      count: 1,
    });

    const profiles = [profile('p1'), profile('p2')];
    const result = await bulkCreate('tournament-1', profiles);

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
    const result = await bulkCreate('tournament-1', profiles);

    expect(prisma.tournamentAthlete.createMany).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });
});

describe('findByTournamentId', () => {
  type ListInput = Parameters<typeof findByTournamentId>[0];

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
    await findByTournamentId({ ...baseInput, unassignedOnly: true });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      tournamentId: 'tournament-1',
      groupId: null,
    });
  });

  it('filters by groupId when provided and unassignedOnly is false', async () => {
    mockResult([], 0);
    await findByTournamentId({ ...baseInput, groupId: 'group-1' });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      tournamentId: 'tournament-1',
      groupId: 'group-1',
    });
  });

  it('prefers unassignedOnly over groupId when both are set', async () => {
    mockResult([], 0);
    await findByTournamentId({
      ...baseInput,
      unassignedOnly: true,
      groupId: 'group-1',
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ groupId: null });
  });

  it('builds case-insensitive OR query for name and affiliation', async () => {
    mockResult([], 0);
    await findByTournamentId({ ...baseInput, query: 'john' });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({
      OR: [
        { name: { contains: 'john', mode: 'insensitive' } },
        { affiliation: { contains: 'john', mode: 'insensitive' } },
      ],
    });
  });

  it('filters by gender using `in`', async () => {
    mockResult([], 0);
    await findByTournamentId({ ...baseInput, gender: ['M'] });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ gender: { in: ['M'] } });
  });

  it('uses beltLevel `in` when beltLevels is provided', async () => {
    mockResult([], 0);
    await findByTournamentId({
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
    await findByTournamentId({
      ...baseInput,
      beltLevelMin: 2,
      beltLevelMax: 6,
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ beltLevel: { gte: 2, lte: 6 } });
  });

  it('filters weight by gte/lte when provided', async () => {
    mockResult([], 0);
    await findByTournamentId({
      ...baseInput,
      weightMin: 50,
      weightMax: 70,
    });

    const args = getFindManyArgs();
    expect(args?.where).toMatchObject({ weight: { gte: 50, lte: 70 } });
  });

  it('honors sorting by mapping {id, desc} to prisma orderBy', async () => {
    mockResult([], 0);
    await findByTournamentId({
      ...baseInput,
      sorting: [
        { id: 'name', desc: false },
        { id: 'weight', desc: true },
      ],
    });

    const args = getFindManyArgs();
    expect(args?.orderBy).toEqual([{ name: 'asc' }, { weight: 'desc' }]);
  });

  it('defaults to createdAt asc when sorting is empty', async () => {
    mockResult([], 0);
    await findByTournamentId(baseInput);

    const args = getFindManyArgs();
    expect(args?.orderBy).toEqual([{ createdAt: 'asc' }]);
  });

  it('paginates using page/perPage and returns { items, total }', async () => {
    const items = [{ id: 'a1' }, { id: 'a2' }];
    mockResult(items, 42);

    const result = await findByTournamentId({
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
