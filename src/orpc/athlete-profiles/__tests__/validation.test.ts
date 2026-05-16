import { describe, expect, it } from 'vitest';
import {
  AthleteProfilesSchema,
  CheckDuplicateSchema,
  CreateAthleteProfileSchema,
  UpdateAthleteProfileSchema,
} from '../dto';

describe('CreateAthleteProfileSchema', () => {
  const valid = {
    athleteCode: 'TKD-001',
    name: 'Nguyen Van A',
    gender: 'M' as const,
    beltLevel: 5,
    weight: 65,
    affiliation: 'TKD Club',
  };

  it('accepts a valid profile', () => {
    expect(CreateAthleteProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing athleteCode', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      athleteCode: undefined,
    });
    expect(result.success).toBe(false);
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

  it('accepts optional https image URL', () => {
    const result = CreateAthleteProfileSchema.safeParse({
      ...valid,
      image: 'https://example.com/p.png',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.image).toBe('https://example.com/p.png');
    }
  });

  it('omits image when not provided', () => {
    const result = CreateAthleteProfileSchema.parse(valid);
    expect(result.image).toBeUndefined();
  });

  it('maps empty image string to undefined', () => {
    const result = CreateAthleteProfileSchema.parse({ ...valid, image: '' });
    expect(result.image).toBeUndefined();
  });

  it('rejects invalid image URL', () => {
    expect(
      CreateAthleteProfileSchema.safeParse({ ...valid, image: 'not-a-url' })
        .success
    ).toBe(false);
  });
});

describe('UpdateAthleteProfileSchema', () => {
  it('requires id', () => {
    const result = UpdateAthleteProfileSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('rejects update without athleteCode', () => {
    const result = UpdateAthleteProfileSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range beltLevel in update', () => {
    const result = UpdateAthleteProfileSchema.safeParse({
      id: 'abc123',
      beltLevel: 11,
    });
    expect(result.success).toBe(false);
  });

  it('omits image when not provided on update', () => {
    const result = UpdateAthleteProfileSchema.parse({
      id: 'abc123',
      athleteCode: 'TKD-001',
    });
    expect(result.image).toBeUndefined();
  });

  it('maps empty image to null on update', () => {
    const result = UpdateAthleteProfileSchema.parse({
      id: 'abc123',
      athleteCode: 'TKD-001',
      image: '',
    });
    expect(result.image).toBeNull();
  });

  it('maps null image on update', () => {
    const result = UpdateAthleteProfileSchema.parse({
      id: 'abc123',
      athleteCode: 'TKD-001',
      image: null,
    });
    expect(result.image).toBeNull();
  });

  it('accepts https image on update', () => {
    const result = UpdateAthleteProfileSchema.parse({
      id: 'abc123',
      athleteCode: 'TKD-001',
      image: 'https://example.com/a.png',
    });
    expect(result.image).toBe('https://example.com/a.png');
  });

  it('rejects invalid image URL on update', () => {
    expect(
      UpdateAthleteProfileSchema.safeParse({
        id: 'abc123',
        athleteCode: 'TKD-001',
        image: 'not-a-url',
      }).success
    ).toBe(false);
  });
});

describe('AthleteProfilesSchema', () => {
  it('uses default values when input is empty', () => {
    const result = AthleteProfilesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.perPage).toBe(20);
      expect(result.data.sorting).toEqual([]);
    }
  });

  it('rejects page less than 1', () => {
    const result = AthleteProfilesSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects perPage above 100', () => {
    const result = AthleteProfilesSchema.safeParse({ perPage: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts gender as a single-value array for list', () => {
    const result = AthleteProfilesSchema.safeParse({ gender: ['M'] });
    expect(result.success).toBe(true);
  });

  it('accepts gender as both sexes for list', () => {
    const result = AthleteProfilesSchema.safeParse({ gender: ['M', 'F'] });
    expect(result.success).toBe(true);
  });

  it('rejects invalid gender in list filter array', () => {
    const result = AthleteProfilesSchema.safeParse({ gender: ['X'] });
    expect(result.success).toBe(false);
  });

  it('accepts beltLevels as discrete OR filter (e.g. Red II + Yellow)', () => {
    const result = AthleteProfilesSchema.safeParse({ beltLevels: [8, 3] });
    expect(result.success).toBe(true);
  });

  it('rejects belt level out of range in beltLevels', () => {
    const result = AthleteProfilesSchema.safeParse({ beltLevels: [8, 11] });
    expect(result.success).toBe(false);
  });
});

describe('CheckDuplicateSchema', () => {
  const valid = {
    athleteCode: 'TKD-001',
    name: 'Nguyen Van A',
    gender: 'M' as const,
    beltLevel: 5,
    weight: 65,
    affiliation: 'TKD Club',
  };

  it('accepts valid input with athleteCode', () => {
    expect(CheckDuplicateSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional excludeId', () => {
    expect(
      CheckDuplicateSchema.safeParse({ ...valid, excludeId: 'some-id' }).success
    ).toBe(true);
  });
});
