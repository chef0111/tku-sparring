import { describe, expect, it } from 'vitest';
import {
  CheckDuplicateSchema,
  CreateAthleteProfileSchema,
  ListAthleteProfilesSchema,
  UpdateAthleteProfileSchema,
} from '../athlete-profiles.dto';

describe('CreateAthleteProfileSchema', () => {
  const valid = {
    name: 'Nguyen Van A',
    gender: 'M' as const,
    beltLevel: 5,
    weight: 65,
    affiliation: 'TKD Club',
  };

  it('accepts a valid profile', () => {
    expect(CreateAthleteProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts an optional athleteCode', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      athleteCode: 'TKD-001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = CreateAthleteProfileSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid gender', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      gender: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('rejects belt level below 0', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      beltLevel: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects belt level above 10', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      beltLevel: 11,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer belt level', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      beltLevel: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight below 20', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      weight: 19,
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight above 150', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      weight: 151,
    });
    expect(result.success).toBe(false);
  });

  it('accepts boundary weight values', () => {
    expect(
      CreateAthleteProfileSchema.safeParse({ ...valid, weight: 20 }).success
    ).toBe(true);
    expect(
      CreateAthleteProfileSchema.safeParse({ ...valid, weight: 150 }).success
    ).toBe(true);
  });

  it('accepts boundary belt values', () => {
    expect(
      CreateAthleteProfileSchema.safeParse({ ...valid, beltLevel: 0 }).success
    ).toBe(true);
    expect(
      CreateAthleteProfileSchema.safeParse({ ...valid, beltLevel: 10 }).success
    ).toBe(true);
  });

  it('rejects missing affiliation', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      affiliation: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateAthleteProfileSchema', () => {
  it('requires id', () => {
    const result = UpdateAthleteProfileSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('allows partial update with only id', () => {
    const result = UpdateAthleteProfileSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejects out-of-range beltLevel in update', () => {
    const result = UpdateAthleteProfileSchema.safeParse({
      id: 'abc123',
      beltLevel: 11,
    });
    expect(result.success).toBe(false);
  });
});

describe('ListAthleteProfilesSchema', () => {
  it('uses default values when input is empty', () => {
    const result = ListAthleteProfilesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
      expect(result.data.sortDir).toBe('desc');
    }
  });

  it('rejects page less than 1', () => {
    const result = ListAthleteProfilesSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects perPage above 100', () => {
    const result = ListAthleteProfilesSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });
});

describe('CheckDuplicateSchema', () => {
  const valid = {
    name: 'Nguyen Van A',
    gender: 'M' as const,
    beltLevel: 5,
    weight: 65,
    affiliation: 'TKD Club',
  };

  it('accepts valid input without athleteCode', () => {
    expect(CheckDuplicateSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts valid input with athleteCode', () => {
    expect(
      CheckDuplicateSchema.safeParse({ ...valid, athleteCode: 'TKD-001' })
        .success
    ).toBe(true);
  });

  it('accepts optional excludeId', () => {
    expect(
      CheckDuplicateSchema.safeParse({ ...valid, excludeId: 'some-id' }).success
    ).toBe(true);
  });
});
