import { z } from 'zod';
import { dataTableConfig } from '@/config/data-table';

export const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export type SortItemSchema = z.infer<typeof sortItemSchema>;

export const dataTableSearchSchema = z.object({
  page: z.number().int().positive().default(1).catch(1),
  perPage: z.number().int().positive().default(10).catch(10),
  sort: z.array(sortItemSchema).default([]).catch([]),
  filters: z.array(filterItemSchema).default([]).catch([]),
  joinOperator: z
    .enum(dataTableConfig.joinOperators)
    .default('and')
    .catch('and'),
});

export type DataTableSearchParams = z.infer<typeof dataTableSearchSchema>;

const FILTER_SEPARATOR = '~';
const FIELD_SEPARATOR = '.';

export function serializeFiltersCompact(
  filters: Array<FilterItemSchema>
): string {
  if (!filters || filters.length === 0) return '';
  return filters
    .map((f) => {
      const value = Array.isArray(f.value) ? f.value.join(',') : f.value;
      return `${f.id}${FIELD_SEPARATOR}${f.operator}${FIELD_SEPARATOR}${f.variant}${FIELD_SEPARATOR}${encodeURIComponent(value)}`;
    })
    .join(FILTER_SEPARATOR);
}

export function parseFiltersCompact(str: string): Array<FilterItemSchema> {
  if (!str) return [];
  try {
    return str.split(FILTER_SEPARATOR).map((part) => {
      const [id, operator, variant, encodedValue] = part.split(FIELD_SEPARATOR);
      const value = decodeURIComponent(encodedValue || '');
      return {
        id,
        operator: operator as FilterItemSchema['operator'],
        variant: (variant as FilterItemSchema['variant']) || 'text',
        value: value.includes(',') ? value.split(',') : value,
        filterId: id,
      };
    });
  } catch {
    return [];
  }
}

export function serializeSortCompact(sort: Array<SortItemSchema>): string {
  if (!sort || sort.length === 0) return '';
  return sort
    .map((s) => `${s.id}${FIELD_SEPARATOR}${s.desc ? 'd' : 'a'}`)
    .join(FILTER_SEPARATOR);
}

export function parseSortCompact(str: string): Array<SortItemSchema> {
  if (!str) return [];
  try {
    return str.split(FILTER_SEPARATOR).map((part) => {
      const [id, dir] = part.split(FIELD_SEPARATOR);
      return { id, desc: dir === 'd' };
    });
  } catch {
    return [];
  }
}

export function serializeSearchParams(
  params: Partial<DataTableSearchParams>
): Record<string, string> {
  const result: Record<string, string> = {};

  if (params.page && params.page !== 1) {
    result.page = String(params.page);
  }
  if (params.perPage && params.perPage !== 10) {
    result.perPage = String(params.perPage);
  }
  if (params.sort && params.sort.length > 0) {
    result.sort = JSON.stringify(params.sort);
  }
  if (params.filters && params.filters.length > 0) {
    result.filters = JSON.stringify(params.filters);
  }
  if (params.joinOperator && params.joinOperator !== 'and') {
    result.joinOperator = params.joinOperator;
  }

  return result;
}

export function deserializeSearchParams(
  searchParams: Record<string, unknown>
): DataTableSearchParams {
  const parsed = {
    page: typeof searchParams.page === 'number' ? searchParams.page : 1,
    perPage:
      typeof searchParams.perPage === 'number' ? searchParams.perPage : 10,
    sort: [] as Array<SortItemSchema>,
    filters: [] as Array<FilterItemSchema>,
    joinOperator: 'and' as 'and' | 'or',
  };

  if (typeof searchParams.sort === 'string') {
    try {
      const sortParsed = JSON.parse(searchParams.sort);
      const result = z.array(sortItemSchema).safeParse(sortParsed);
      if (result.success) {
        parsed.sort = result.data;
      }
    } catch {
      // Invalid JSON, use default
    }
  } else if (Array.isArray(searchParams.sort)) {
    const result = z.array(sortItemSchema).safeParse(searchParams.sort);
    if (result.success) {
      parsed.sort = result.data;
    }
  }

  if (typeof searchParams.filters === 'string') {
    try {
      const filtersParsed = JSON.parse(searchParams.filters);
      const result = z.array(filterItemSchema).safeParse(filtersParsed);
      if (result.success) {
        parsed.filters = result.data;
      }
    } catch {
      // Invalid JSON, use default
    }
  } else if (Array.isArray(searchParams.filters)) {
    const result = z.array(filterItemSchema).safeParse(searchParams.filters);
    if (result.success) {
      parsed.filters = result.data;
    }
  }

  if (
    typeof searchParams.joinOperator === 'string' &&
    (searchParams.joinOperator === 'and' || searchParams.joinOperator === 'or')
  ) {
    parsed.joinOperator = searchParams.joinOperator;
  }

  return parsed;
}
