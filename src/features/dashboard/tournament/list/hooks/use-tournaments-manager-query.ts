import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs';
import type { TournamentListItem } from '@/features/dashboard/types';
import {
  getFiltersStateParser,
  getSortingStateParser,
} from '@/lib/data-table/parsers';

const SORTABLE_COLUMN_IDS = new Set([
  'name',
  'status',
  'athletes',
  'createdAt',
]);

export function useTournamentsManagerQuery() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(20));
  const [queryFilter] = useQueryState('query');
  const [nameFilter] = useQueryState('name');
  const [statusFilter] = useQueryState(
    'status',
    parseAsArrayOf(parseAsStringEnum(['draft', 'active', 'completed']), ',')
  );
  const [sort] = useQueryState(
    'sort',
    getSortingStateParser<TournamentListItem>(SORTABLE_COLUMN_IDS).withDefault([
      { id: 'createdAt', desc: true },
    ])
  );
  const [filters] = useQueryState(
    'filters',
    getFiltersStateParser<TournamentListItem>().withDefault([])
  );
  const [joinOperator] = useQueryState(
    'joinOperator',
    parseAsStringEnum(['and', 'or']).withDefault('and')
  );

  return {
    page,
    perPage,
    queryFilter,
    nameFilter,
    statusFilter,
    sort,
    filters,
    joinOperator,
  };
}

export type TournamentsManagerQuery = ReturnType<
  typeof useTournamentsManagerQuery
>;
