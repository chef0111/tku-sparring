import { z } from 'zod';
import type { TournamentStatus } from '@/features/dashboard/types';

export const TournamentStatusSchema = z.enum(['draft', 'active', 'completed']);
export type TournamentStatusValue = z.infer<typeof TournamentStatusSchema>;

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
};

const STATUS_RANK: Record<TournamentStatus, number> = {
  draft: 0,
  active: 1,
  completed: 2,
};

const NEXT_STATUS: Record<TournamentStatus, TournamentStatus | null> = {
  draft: 'active',
  active: 'completed',
  completed: null,
};

export function tournamentStatusRiskNotes(
  from: TournamentStatus,
  to: TournamentStatus
): Array<string> {
  const notes: Array<string> = [];
  if (from === 'completed' && to !== 'completed') {
    notes.push('Moving away from Completed re-enables editing in the builder.');
  }
  if (to === 'completed') {
    notes.push('Completed marks the tournament workspace read-only.');
  }
  if (to === 'draft' && from !== 'draft') {
    notes.push(
      'Moving to Draft restores draft-only bracket operations where applicable.'
    );
  }
  if (to === 'active' && from === 'draft') {
    notes.push(
      'Active allows live scoring and arena selection for active tournaments.'
    );
  }
  if (notes.length === 0) {
    notes.push('This is an administrative status override.');
  }
  return notes;
}

export function isBackwardStatusTransition(
  from: TournamentStatus,
  to: TournamentStatus
): boolean {
  return STATUS_RANK[to] < STATUS_RANK[from];
}

export function forceSetTournamentStatus(
  from: TournamentStatus,
  to: TournamentStatus
): boolean {
  return NEXT_STATUS[from] !== to;
}
