import { toast } from 'sonner';

/** Persists default tournament for bulk-add dialog and quick row-menu adds. */
export const LAST_USED_TOURNAMENT_KEY = 'tku:lastUsedTournamentId';

export function bulkAddAthleteResult(result: {
  added: number;
  assigned: number;
  unassigned: number;
}) {
  const { added, unassigned } = result;

  if (added === 0) {
    toast.info('Selected athletes are already in this tournament.');
  } else if (unassigned === added) {
    toast.success(
      `Added ${added} athlete${added !== 1 ? 's' : ''} to the unassigned pool.`
    );
  } else {
    toast.success(
      `Added ${added} athlete${added !== 1 ? 's' : ''}. ${result.assigned} assigned, ${unassigned} unassigned.`
    );
  }
}
