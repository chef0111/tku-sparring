import { addDays, endOfDay, startOfDay } from 'date-fns';

import type {
  FilterOperator,
  FilterVariant,
  JoinOperator,
} from '@/types/data-table';
import type { FilterItemSchema } from '@/lib/data-table/parsers';
import { dataTableConfig } from '@/config/data-table';

const operatorMap: Record<FilterVariant, Array<FilterOperator>> = {
  text: dataTableConfig.textOperators.map((operator) => operator.value),
  number: dataTableConfig.numericOperators.map((operator) => operator.value),
  range: dataTableConfig.numericOperators.map((operator) => operator.value),
  date: dataTableConfig.dateOperators.map((operator) => operator.value),
  dateRange: dataTableConfig.dateOperators.map((operator) => operator.value),
  boolean: dataTableConfig.booleanOperators.map((operator) => operator.value),
  select: dataTableConfig.selectOperators.map((operator) => operator.value),
  multiSelect: dataTableConfig.multiSelectOperators.map(
    (operator) => operator.value
  ),
};

type FilterValue = string | Array<string>;
type Primitive = string | number | boolean | Date;

type Condition = Record<string, unknown>;

export type FieldDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'stringArray'
  | 'numberArray'
  | 'json';

export interface FilterFieldMapping {
  path: Array<string>;
  variant: FilterVariant;
  dataType: FieldDataType;
  operators?: Array<FilterOperator>;
  parse?: (value: FilterValue) => Primitive | Array<Primitive> | null;
  allowUnset?: boolean;
}

export type FilterFieldMap = Record<string, FilterFieldMapping>;

interface FilterColumnsOptions {
  filters: Array<FilterItemSchema>;
  joinOperator: JoinOperator;
  fields: FilterFieldMap;
}

function buildPathCondition(path: Array<string>, leaf: Condition): Condition {
  return path.reduceRight<Condition>((acc, key) => ({ [key]: acc }), leaf);
}

function combineConditions(
  operator: JoinOperator,
  conditions: Array<Condition | undefined>
): Condition | undefined {
  const valid = conditions.filter(Boolean) as Array<Condition>;
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  return operator === 'and' ? { AND: valid } : { OR: valid };
}

function getAllowedOperators(field: FilterFieldMapping) {
  return field.operators ?? operatorMap[field.variant] ?? operatorMap.text;
}

function parseNumberValue(value: string): number | null {
  if (value.trim() === '') return null;
  const numValue = Number(value);
  return Number.isNaN(numValue) ? null : numValue;
}

function parseBooleanValue(value: string): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function parseDateValue(value: string): Date | null {
  if (value.trim() === '') return null;
  const numValue = Number(value);
  if (Number.isNaN(numValue)) return null;
  const date = new Date(numValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseValue(
  field: FilterFieldMapping,
  value: FilterValue
): Primitive | Array<Primitive> | null {
  if (field.parse) return field.parse(value);

  if (field.dataType === 'string') {
    return typeof value === 'string' ? value : value;
  }

  if (field.dataType === 'number') {
    if (Array.isArray(value)) {
      const parsed = value
        .map(parseNumberValue)
        .filter((item): item is number => item !== null);
      return parsed.length > 0 ? parsed : null;
    }
    return parseNumberValue(value);
  }

  if (field.dataType === 'boolean') {
    return typeof value === 'string' ? parseBooleanValue(value) : null;
  }

  if (field.dataType === 'date') {
    if (Array.isArray(value)) {
      const parsed = value
        .map(parseDateValue)
        .filter((item): item is Date => item !== null);
      return parsed.length > 0 ? parsed : null;
    }
    return parseDateValue(value);
  }

  if (field.dataType === 'stringArray') {
    return Array.isArray(value) ? value : null;
  }

  if (field.dataType === 'numberArray') {
    if (!Array.isArray(value)) return null;
    const parsed = value
      .map(parseNumberValue)
      .filter((item): item is number => item !== null);
    return parsed.length > 0 ? parsed : null;
  }

  return null;
}

function buildEmptyCondition(field: FilterFieldMapping): Condition | undefined {
  const conditions: Array<Condition> = [];

  if (field.dataType === 'string') {
    conditions.push(buildPathCondition(field.path, { equals: '' }));
    conditions.push(buildPathCondition(field.path, { equals: null }));
  } else if (field.dataType === 'json') {
    conditions.push(buildPathCondition(field.path, { equals: {} }));
    conditions.push(buildPathCondition(field.path, { equals: null }));
  } else if (field.dataType.endsWith('Array')) {
    conditions.push(buildPathCondition(field.path, { equals: [] }));
    conditions.push(buildPathCondition(field.path, { equals: null }));
  } else {
    conditions.push(buildPathCondition(field.path, { equals: null }));
  }

  if (field.allowUnset) {
    conditions.push(buildPathCondition(field.path, { isSet: false }));
  }

  if (conditions.length === 1) return conditions[0];
  return { OR: conditions };
}

function buildDateRangeCondition(
  field: FilterFieldMapping,
  start?: Date | null,
  end?: Date | null
): Condition | undefined {
  const conditions: Array<Condition> = [];

  if (start) {
    conditions.push(buildPathCondition(field.path, { gte: startOfDay(start) }));
  }

  if (end) {
    conditions.push(buildPathCondition(field.path, { lte: endOfDay(end) }));
  }

  return combineConditions('and', conditions);
}

function buildCondition(
  filter: FilterItemSchema,
  field: FilterFieldMapping
): Condition | undefined {
  const allowedOperators = getAllowedOperators(field);
  if (!allowedOperators.includes(filter.operator)) return undefined;

  switch (filter.operator) {
    case 'iLike': {
      if (typeof filter.value !== 'string' || !filter.value.trim()) {
        return undefined;
      }
      return buildPathCondition(field.path, {
        contains: filter.value,
        mode: 'insensitive',
      });
    }

    case 'notILike': {
      if (typeof filter.value !== 'string' || !filter.value.trim()) {
        return undefined;
      }
      return {
        NOT: buildPathCondition(field.path, {
          contains: filter.value,
          mode: 'insensitive',
        }),
      };
    }

    case 'eq': {
      if (field.dataType === 'date') {
        if (typeof filter.value !== 'string') return undefined;
        const date = parseDateValue(filter.value);
        if (!date) return undefined;
        return buildDateRangeCondition(field, date, date);
      }

      const parsed = parseValue(field, filter.value);
      if (parsed == null || Array.isArray(parsed)) return undefined;
      return buildPathCondition(field.path, { equals: parsed });
    }

    case 'ne': {
      if (field.dataType === 'date') {
        if (typeof filter.value !== 'string') return undefined;
        const date = parseDateValue(filter.value);
        if (!date) return undefined;
        const start = startOfDay(date);
        const end = endOfDay(date);
        return {
          OR: [
            buildPathCondition(field.path, { lt: start }),
            buildPathCondition(field.path, { gt: end }),
          ],
        };
      }

      const parsed = parseValue(field, filter.value);
      if (parsed == null || Array.isArray(parsed)) return undefined;
      return buildPathCondition(field.path, { not: parsed });
    }

    case 'inArray': {
      if (!Array.isArray(filter.value)) return undefined;
      const parsed = parseValue(field, filter.value);
      if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
      return buildPathCondition(field.path, { in: parsed });
    }

    case 'notInArray': {
      if (!Array.isArray(filter.value)) return undefined;
      const parsed = parseValue(field, filter.value);
      if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
      return buildPathCondition(field.path, { notIn: parsed });
    }

    case 'lt': {
      if (field.dataType === 'date') {
        if (typeof filter.value !== 'string') return undefined;
        const date = parseDateValue(filter.value);
        if (!date) return undefined;
        return buildPathCondition(field.path, { lt: endOfDay(date) });
      }

      const parsed = parseValue(field, filter.value);
      if (parsed == null || Array.isArray(parsed)) return undefined;
      return buildPathCondition(field.path, { lt: parsed });
    }

    case 'lte': {
      if (field.dataType === 'date') {
        if (typeof filter.value !== 'string') return undefined;
        const date = parseDateValue(filter.value);
        if (!date) return undefined;
        return buildPathCondition(field.path, { lte: endOfDay(date) });
      }

      const parsed = parseValue(field, filter.value);
      if (parsed == null || Array.isArray(parsed)) return undefined;
      return buildPathCondition(field.path, { lte: parsed });
    }

    case 'gt': {
      if (field.dataType === 'date') {
        if (typeof filter.value !== 'string') return undefined;
        const date = parseDateValue(filter.value);
        if (!date) return undefined;
        return buildPathCondition(field.path, { gt: startOfDay(date) });
      }

      const parsed = parseValue(field, filter.value);
      if (parsed == null || Array.isArray(parsed)) return undefined;
      return buildPathCondition(field.path, { gt: parsed });
    }

    case 'gte': {
      if (field.dataType === 'date') {
        if (typeof filter.value !== 'string') return undefined;
        const date = parseDateValue(filter.value);
        if (!date) return undefined;
        return buildPathCondition(field.path, { gte: startOfDay(date) });
      }

      const parsed = parseValue(field, filter.value);
      if (parsed == null || Array.isArray(parsed)) return undefined;
      return buildPathCondition(field.path, { gte: parsed });
    }

    case 'isBetween': {
      if (!Array.isArray(filter.value)) return undefined;

      if (field.dataType === 'date') {
        const start = parseDateValue(filter.value[0] ?? '');
        const end = parseDateValue(filter.value[1] ?? '');
        return buildDateRangeCondition(field, start, end);
      }

      if (field.dataType === 'number') {
        const firstValue = parseNumberValue(filter.value[0] ?? '');
        const secondValue = parseNumberValue(filter.value[1] ?? '');

        if (firstValue === null && secondValue === null) return undefined;
        if (firstValue !== null && secondValue === null) {
          return buildPathCondition(field.path, { equals: firstValue });
        }
        if (firstValue === null && secondValue !== null) {
          return buildPathCondition(field.path, { equals: secondValue });
        }
        return combineConditions('and', [
          buildPathCondition(field.path, { gte: firstValue }),
          buildPathCondition(field.path, { lte: secondValue }),
        ]);
      }

      return undefined;
    }

    case 'isRelativeToToday': {
      if (field.dataType !== 'date') return undefined;
      if (typeof filter.value !== 'string') return undefined;

      const [amount, unit] = filter.value.split(' ') ?? [];
      if (!amount || !unit) return undefined;

      const amountValue = Number.parseInt(amount, 10);
      if (Number.isNaN(amountValue)) return undefined;

      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (unit) {
        case 'days':
          startDate = startOfDay(addDays(today, amountValue));
          endDate = endOfDay(startDate);
          break;
        case 'weeks':
          startDate = startOfDay(addDays(today, amountValue * 7));
          endDate = endOfDay(addDays(startDate, 6));
          break;
        case 'months':
          startDate = startOfDay(addDays(today, amountValue * 30));
          endDate = endOfDay(addDays(startDate, 29));
          break;
        default:
          return undefined;
      }

      return combineConditions('and', [
        buildPathCondition(field.path, { gte: startDate }),
        buildPathCondition(field.path, { lte: endDate }),
      ]);
    }

    case 'isEmpty':
      return buildEmptyCondition(field);

    case 'isNotEmpty': {
      const emptyCondition = buildEmptyCondition(field);
      if (!emptyCondition) return undefined;
      return { NOT: emptyCondition };
    }

    default:
      return undefined;
  }
}

export function filterColumns({
  filters,
  joinOperator,
  fields,
}: FilterColumnsOptions): Condition | undefined {
  const conditions = filters
    .map((filter) => {
      const field = fields[filter.id];
      if (!field) return undefined;
      return buildCondition(filter, field);
    })
    .filter(Boolean) as Array<Condition>;

  if (conditions.length === 0) return undefined;

  return joinOperator === 'and' ? { AND: conditions } : { OR: conditions };
}
