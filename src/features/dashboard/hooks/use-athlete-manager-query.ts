import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs';
import type { AthleteProfileData } from '@/features/dashboard/types';
import {
  getFiltersStateParser,
  getSortingStateParser,
} from '@/lib/data-table/parsers';
import { parseRangeParam } from '@/lib/data-table/utils';
import { DEFAULT_SORTING } from '@/config/athlete';

const ARRAY_SEPARATOR = ',';

function parseBeltLevelsFromQuery(
  values: Array<string> | null | undefined
): Array<number> | undefined {
  if (values == null || values.length === 0) return undefined;
  const nums = values
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 10);
  return nums.length > 0 ? [...new Set(nums)] : undefined;
}

const SORTABLE_COLUMN_IDS = new Set([
  'name',
  'beltLevel',
  'weight',
  'affiliation',
  'createdAt',
]);

export function useAthleteTableQuery() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [queryFilter] = useQueryState('query');
  const [athleteCodeFilter] = useQueryState('athleteCode');
  const [nameFilter] = useQueryState('name');
  const [genderFilter] = useQueryState(
    'gender',
    parseAsArrayOf(parseAsString, ',')
  );
  const [affiliationFilter] = useQueryState('affiliation');
  const [beltLevelQuery] = useQueryState(
    'beltLevel',
    parseAsArrayOf(parseAsString, ARRAY_SEPARATOR)
  );
  const [weightFilter] = useQueryState('weight');
  const [sort] = useQueryState(
    'sort',
    getSortingStateParser<AthleteProfileData>(SORTABLE_COLUMN_IDS).withDefault(
      DEFAULT_SORTING
    )
  );
  const [filters] = useQueryState(
    'filters',
    getFiltersStateParser<AthleteProfileData>().withDefault([])
  );
  const [joinOperator] = useQueryState(
    'joinOperator',
    parseAsStringEnum(['and', 'or']).withDefault('and')
  );

  const beltLevels = parseBeltLevelsFromQuery(beltLevelQuery ?? undefined);
  const weightRange = parseRangeParam(weightFilter);

  return {
    page,
    perPage,
    queryFilter,
    athleteCodeFilter,
    nameFilter,
    genderFilter,
    affiliationFilter,
    beltLevels,
    weightFilter,
    sort,
    weightRange,
    filters,
    joinOperator,
  };
}
