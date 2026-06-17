import type { TournamentStatusValue } from '@/lib/tournament/tournament-status';
import { TournamentStatusSchema } from '@/lib/tournament/tournament-status';
import { PolicyViolationError } from '@/server/application/errors';

export type TournamentAction =
  | 'group.create'
  | 'group.update'
  | 'group.delete'
  | 'group.assignAthlete'
  | 'group.autoAssign'
  | 'arenaOrder.update'
  | 'bracket.generate'
  | 'bracket.shuffle'
  | 'bracket.reset'
  | 'bracket.regenerate'
  | 'match.score'
  | 'match.claim'
  | 'match.custom.create'
  | 'match.custom.delete'
  | 'match.slot.edit'
  | 'roster.add'
  | 'roster.update'
  | 'roster.delete'
  | 'tournament.update'
  | 'tournament.delete'
  | 'tournament.status.force';

const draftOnly = new Set<TournamentAction>([
  'group.create',
  'group.update',
  'group.delete',
  'group.assignAthlete',
  'group.autoAssign',
  'arenaOrder.update',
  'bracket.generate',
  'bracket.shuffle',
  'bracket.reset',
  'bracket.regenerate',
  'match.slot.edit',
  'roster.add',
  'roster.update',
  'roster.delete',
  'tournament.delete',
]);

export function assertTournamentAction(
  status: TournamentStatusValue | string,
  action: TournamentAction
) {
  const parsedStatus = TournamentStatusSchema.parse(status);

  if (parsedStatus === 'completed') {
    throw new PolicyViolationError('Completed tournaments are read-only');
  }
  if (draftOnly.has(action) && parsedStatus !== 'draft') {
    throw new PolicyViolationError(
      'This action is only allowed in Draft status'
    );
  }
}

export function assertCanForceTournamentStatus(
  status: TournamentStatusValue | string
) {
  assertTournamentAction(status, 'tournament.status.force');
}
