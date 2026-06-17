import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AthleteProfileStore } from '@/server/application/athlete-profiles/repositories/profile';
import { runDedupCheck } from '@/server/application/athlete-profiles/use-cases/dedup';

const store: AthleteProfileStore = {
  list: vi.fn(),
  findById: vi.fn(),
  findByAthleteCodeAndName: vi.fn(),
  findPossibleDuplicates: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  bulkRemove: vi.fn(),
};

const existingProfile = {
  id: 'existing-id',
  name: 'Nguyen Van A',
  affiliation: 'TKD Club',
};

const baseInput = {
  athleteCode: '',
  name: 'Nguyen Van A',
  affiliation: 'TKD Club',
  beltLevel: 5,
  weight: 65,
};

describe('runDedupCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no duplicate when no matches exist (no athleteCode)', async () => {
    vi.mocked(store.findPossibleDuplicates).mockResolvedValue([]);

    const result = await runDedupCheck(baseInput, store);

    expect(result.isDuplicate).toBe(false);
    expect(result.isHardBlock).toBe(false);
    expect(result.matches).toHaveLength(0);
    expect(store.findByAthleteCodeAndName).not.toHaveBeenCalled();
  });

  it('returns hard block when athleteCode + name already exist', async () => {
    vi.mocked(store.findByAthleteCodeAndName).mockResolvedValue(
      existingProfile
    );

    const result = await runDedupCheck(
      {
        ...baseInput,
        athleteCode: 'TKD-001',
      },
      store
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.isHardBlock).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].id).toBe('existing-id');
    expect(store.findPossibleDuplicates).not.toHaveBeenCalled();
  });

  it('returns no duplicate when athleteCode provided but no collision found', async () => {
    vi.mocked(store.findByAthleteCodeAndName).mockResolvedValue(null);

    const result = await runDedupCheck(
      {
        ...baseInput,
        athleteCode: 'TKD-NEW',
      },
      store
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.isHardBlock).toBe(false);
    expect(store.findPossibleDuplicates).not.toHaveBeenCalled();
  });

  it('returns soft warning when name+affiliation+belt+weight all match (no athleteCode)', async () => {
    vi.mocked(store.findPossibleDuplicates).mockResolvedValue([
      existingProfile,
    ]);

    const result = await runDedupCheck(baseInput, store);

    expect(result.isDuplicate).toBe(true);
    expect(result.isHardBlock).toBe(false);
    expect(result.matches).toHaveLength(1);
    expect(store.findByAthleteCodeAndName).not.toHaveBeenCalled();
  });

  it('passes excludeId to store for edit flows', async () => {
    vi.mocked(store.findPossibleDuplicates).mockResolvedValue([]);

    await runDedupCheck({ ...baseInput, excludeId: 'self-id' }, store);

    expect(store.findPossibleDuplicates).toHaveBeenCalledWith(
      expect.objectContaining({ excludeId: 'self-id' })
    );
  });

  it('passes excludeId to hard-block check when athleteCode provided', async () => {
    vi.mocked(store.findByAthleteCodeAndName).mockResolvedValue(null);

    await runDedupCheck(
      {
        ...baseInput,
        athleteCode: 'TKD-001',
        excludeId: 'self-id',
      },
      store
    );

    expect(store.findByAthleteCodeAndName).toHaveBeenCalledWith(
      'TKD-001',
      baseInput.name,
      'self-id'
    );
  });
});
