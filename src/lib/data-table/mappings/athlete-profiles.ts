import type { FilterFieldMap } from '@/lib/data-table/filter-columns';

function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const numValue = Number(value);
  return Number.isNaN(numValue) ? null : numValue;
}

export const athleteProfileFilterMap: FilterFieldMap = {
  athleteCode: {
    path: ['athleteCode'],
    variant: 'text',
    dataType: 'string',
    allowUnset: true,
  },
  name: {
    path: ['name'],
    variant: 'text',
    dataType: 'string',
  },
  gender: {
    path: ['gender'],
    variant: 'multiSelect',
    dataType: 'string',
  },
  beltLevel: {
    path: ['beltLevel'],
    variant: 'select',
    dataType: 'number',
    parse: (value) => {
      if (Array.isArray(value)) {
        const parsed = value
          .map(parseNumber)
          .filter((item): item is number => item !== null);
        return parsed.length > 0 ? parsed : null;
      }
      return typeof value === 'string' ? parseNumber(value) : null;
    },
  },
  weight: {
    path: ['weight'],
    variant: 'range',
    dataType: 'number',
  },
  affiliation: {
    path: ['affiliation'],
    variant: 'text',
    dataType: 'string',
  },
  createdAt: {
    path: ['createdAt'],
    variant: 'date',
    dataType: 'date',
  },
};
