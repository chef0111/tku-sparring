import type {
  GenerateBracketCommand,
  GroupBracketCommand,
} from './bracket-lifecycle-commands';
import type { BracketLifecycleStore } from '../repositories/bracket-lifecycle';
import { parseRound0Baseline } from '@/server/domain/tournament/bracket/round0-baseline';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function generateBracket(
  command: GenerateBracketCommand,
  store: BracketLifecycleStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'bracket.generate');

  const existing = await store.countBracketMatches(command.groupId);
  if (existing > 0) {
    throw new BadRequestError(
      'Matches already exist for this group. Use regenerate to recreate.'
    );
  }

  return store.generate({
    command,
    group,
    activity: { eventType: 'bracket.generate' },
  });
}

export async function shuffleBracket(
  command: GroupBracketCommand,
  store: BracketLifecycleStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'bracket.shuffle');

  return store.shuffle({
    command,
    group,
    activity: { eventType: 'bracket.shuffle', payload: {} },
  });
}

export async function resetBracket(
  command: GroupBracketCommand,
  store: BracketLifecycleStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'bracket.reset');

  const baseline = parseRound0Baseline(group.round0Baseline);
  if (!baseline) {
    throw new BadRequestError(
      'No saved bracket layout yet. Shuffle once to save a layout, then reset can restore it.'
    );
  }

  return store.reset({
    command,
    group,
    activity: { eventType: 'bracket.reset', payload: {} },
  });
}

export async function regenerateBracket(
  command: GroupBracketCommand,
  store: BracketLifecycleStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'bracket.regenerate');

  return store.regenerate({
    command,
    group,
    activity: { eventType: 'bracket.regenerate', payload: {} },
  });
}
