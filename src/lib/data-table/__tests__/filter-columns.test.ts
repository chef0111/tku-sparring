import { describe, expect, it } from 'vitest';
import { filterColumns } from '@/lib/data-table/filter-columns';
import { athleteProfileFilterMap } from '@/lib/data-table/mappings/athlete-profiles';

describe('filterColumns', () => {
  it('builds Postgres-safe isEmpty for optional athleteCode', () => {
    const where = filterColumns({
      filters: [
        {
          id: 'athleteCode',
          value: '',
          variant: 'text',
          operator: 'isEmpty',
          filterId: 'f1',
        },
      ],
      joinOperator: 'and',
      fields: athleteProfileFilterMap,
    });

    expect(where).toEqual({
      AND: [
        {
          OR: [
            { athleteCode: { equals: '' } },
            { athleteCode: { equals: null } },
          ],
        },
      ],
    });
    expect(JSON.stringify(where)).not.toContain('isSet');
  });

  it('builds isNotEmpty as NOT of empty condition', () => {
    const where = filterColumns({
      filters: [
        {
          id: 'athleteCode',
          value: '',
          variant: 'text',
          operator: 'isNotEmpty',
          filterId: 'f2',
        },
      ],
      joinOperator: 'and',
      fields: athleteProfileFilterMap,
    });

    expect(where).toEqual({
      AND: [
        {
          NOT: {
            OR: [
              { athleteCode: { equals: '' } },
              { athleteCode: { equals: null } },
            ],
          },
        },
      ],
    });
  });
});
