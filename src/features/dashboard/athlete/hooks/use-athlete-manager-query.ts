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
  const [beltFilter] = useQueryState('beltLevel');
  const [weightFilter] = useQueryState('weight');
  const [sort] = useQueryState(
    'sort',
    getSortingStateParser<AthleteProfileData>(SORTABLE_COLUMN_IDS).withDefault(
      []
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

  const beltRange = parseRangeParam(beltFilter);
  const weightRange = parseRangeParam(weightFilter);

  return {
    page,
    perPage,
    queryFilter,
    athleteCodeFilter,
    nameFilter,
    genderFilter,
    affiliationFilter,
    beltFilter,
    weightFilter,
    sort,
    beltRange,
    weightRange,
    filters,
    joinOperator,
  };
}
