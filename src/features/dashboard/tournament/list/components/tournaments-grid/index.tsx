import { TournamentsEmptyState } from '../tournaments-empty-state';
import { TournamentCardSkeleton } from './tournament-card-skeleton';
import { TournamentCard } from './tournament-card';
import type { TournamentsManagerQuery } from '../../hooks/use-tournaments-manager-query';
import type {
  TournamentListItem,
  TournamentRowActionOptions,
  TournamentSortField,
  TournamentStatus,
} from '@/features/dashboard/types';
import { useTournamentList } from '@/queries/tournaments';
import { cn } from '@/lib/utils';

interface TournamentsGridProps {
  query: TournamentsManagerQuery;
  onRowAction: TournamentRowActionOptions['onRowAction'];
  onCreate: () => void;
  onClearFilters: () => void;
  className?: string;
}

export function TournamentsGrid({
  query,
  onRowAction,
  onCreate,
  onClearFilters,
  className,
}: TournamentsGridProps) {
  const { isPending, data } = useTournamentList({
    page: query.page,
    perPage: query.perPage,
    query: query.queryFilter ?? undefined,
    name: query.nameFilter ?? undefined,
    status:
      query.statusFilter && query.statusFilter.length > 0
        ? (query.statusFilter as Array<TournamentStatus>)
        : undefined,
    sort: query.sort?.[0]?.id as TournamentSortField,
    sortDir: query.sort?.[0]?.desc ? 'desc' : 'asc',
  });

  const tournaments = (data?.items ?? []) as Array<TournamentListItem>;

  if (isPending && !data) {
    return (
      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <TournamentCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if ((data?.total ?? 0) === 0) {
    const hasActiveFilters =
      (query.queryFilter ?? '').trim().length > 0 ||
      (query.statusFilter?.length ?? 0) > 0;

    return (
      <TournamentsEmptyState
        variant={hasActiveFilters ? 'no-results' : 'no-data'}
        onCreate={hasActiveFilters ? undefined : onCreate}
        onClearFilters={hasActiveFilters ? onClearFilters : undefined}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          onRowAction={onRowAction}
        />
      ))}
    </div>
  );
}
