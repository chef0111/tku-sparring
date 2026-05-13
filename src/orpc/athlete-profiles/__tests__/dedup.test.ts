import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AthleteProfileDAL } from '../dal';
import { runDedupCheck } from '../dedup';

vi.mock('../dal', () => ({
  AthleteProfileDAL: {
    findByAthleteCodeAndName: vi.fn(),
    findPossibleDuplicates: vi.fn(),
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteProfile: vi.fn(),
    deleteProfiles: vi.fn(),
  },
}));

const existingProfile = {
  id: 'existing-id',
  name: 'Nguyen Van A',
  nameSortKey: 'a',
  gender: 'M',
  beltLevel: 5,
  weight: 65,
  affiliation: 'TKD Club',
  athleteCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    vi.mocked(AthleteProfileDAL.findPossibleDuplicates).mockResolvedValue([]);

    const result = await runDedupCheck(baseInput);

    expect(result.isDuplicate).toBe(false);
    expect(result.isHardBlock).toBe(false);
    expect(result.matches).toHaveLength(0);
    expect(AthleteProfileDAL.findByAthleteCodeAndName).not.toHaveBeenCalled();
  });

  it('returns hard block when athleteCode + name already exist', async () => {
    vi.mocked(AthleteProfileDAL.findByAthleteCodeAndName).mockResolvedValue(
      existingProfile
    );

    const result = await runDedupCheck({
      ...baseInput,
      athleteCode: 'TKD-001',
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.isHardBlock).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].id).toBe('existing-id');
    expect(AthleteProfileDAL.findPossibleDuplicates).not.toHaveBeenCalled();
  });

  it('returns no duplicate when athleteCode provided but no collision found', async () => {
    vi.mocked(AthleteProfileDAL.findByAthleteCodeAndName).mockResolvedValue(
      null
    );

    const result = await runDedupCheck({
      ...baseInput,
      athleteCode: 'TKD-NEW',
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.isHardBlock).toBe(false);
    // Soft check skipped when athleteCode is provided
    expect(AthleteProfileDAL.findPossibleDuplicates).not.toHaveBeenCalled();
  });

  it('returns soft warning when name+affiliation+belt+weight all match (no athleteCode)', async () => {
    vi.mocked(AthleteProfileDAL.findPossibleDuplicates).mockResolvedValue([
      existingProfile,
    ]);

    const result = await runDedupCheck(baseInput);

    expect(result.isDuplicate).toBe(true);
    expect(result.isHardBlock).toBe(false);
    expect(result.matches).toHaveLength(1);
    expect(AthleteProfileDAL.findByAthleteCodeAndName).not.toHaveBeenCalled();
  });

  it('passes excludeId to DAL functions for edit flows', async () => {
    vi.mocked(AthleteProfileDAL.findPossibleDuplicates).mockResolvedValue([]);

    await runDedupCheck({ ...baseInput, excludeId: 'self-id' });

    expect(AthleteProfileDAL.findPossibleDuplicates).toHaveBeenCalledWith(
      expect.objectContaining({ excludeId: 'self-id' })
    );
  });

  it('passes excludeId to hard-block check when athleteCode provided', async () => {
    vi.mocked(AthleteProfileDAL.findByAthleteCodeAndName).mockResolvedValue(
      null
    );

    await runDedupCheck({
      ...baseInput,
      athleteCode: 'TKD-001',
      excludeId: 'self-id',
    });

    expect(AthleteProfileDAL.findByAthleteCodeAndName).toHaveBeenCalledWith(
      'TKD-001',
      baseInput.name,
      'self-id'
    );
  });
});
