import type { TournamentStatusDTO } from '@/orpc/tournaments/dto';
import { badRequest } from '@/orpc/errors';
import { TournamentStatusSchema } from '@/orpc/tournaments/dto';

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
  status: TournamentStatusDTO | string,
  action: TournamentAction
) {
  const parsedStatus = TournamentStatusSchema.parse(status);

  if (parsedStatus === 'completed') {
    badRequest('Completed tournaments are read-only');
  }
  if (draftOnly.has(action) && parsedStatus !== 'draft') {
    badRequest('This action is only allowed in Draft status');
  }
}

export function assertCanForceTournamentStatus(
  status: TournamentStatusDTO | string
) {
  assertTournamentAction(status, 'tournament.status.force');
}
