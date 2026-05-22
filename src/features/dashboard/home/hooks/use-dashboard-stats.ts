import { useMemo } from 'react';
import { computeDashboardStats } from '../lib/compute-dashboard-stats';
import type { TournamentListItem } from '@/features/dashboard/types';
import { useTournaments } from '@/queries/tournaments';

export function useDashboardStats() {
  const query = useTournaments();

  const stats = useMemo(() => {
    const items = (query.data ?? []) as Array<TournamentListItem>;
    return computeDashboardStats(items);
  }, [query.data]);

  return { ...query, stats };
}
