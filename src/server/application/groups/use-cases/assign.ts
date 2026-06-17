import type {
  AssignAthleteCommand,
  AutoAssignAllCommand,
  AutoAssignCommand,
  UnassignAthleteCommand,
} from './assign-commands';
import type { GroupAssignmentStore } from '../repositories/assign';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function assignAthleteToGroup(
  command: AssignAthleteCommand,
  store: GroupAssignmentStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'group.assignAthlete');

  const athlete = await store.findTournamentAthlete(
    command.tournamentAthleteId
  );
  if (!athlete) throw new NotFoundError('Tournament athlete not found');
  if (athlete.tournamentId !== group.tournamentId) {
    throw new BadRequestError('Athlete does not belong to this tournament');
  }

  return store.assignAthlete({
    ...command,
    activity: {
      eventType: 'group.athlete_assigned',
      payload: { groupId: command.groupId },
    },
  });
}

export async function unassignAthleteFromGroup(
  command: UnassignAthleteCommand,
  store: GroupAssignmentStore
) {
  return store.unassignAthlete({
    ...command,
    activity: {
      eventType: 'group.athlete_unassigned',
      payload: {},
    },
  });
}

export async function autoAssignGroup(
  command: AutoAssignCommand,
  store: GroupAssignmentStore
) {
  const group = await store.findGroup(command.groupId);
  if (!group) throw new NotFoundError('Group not found');
  assertTournamentAction(group.tournamentStatus, 'group.autoAssign');

  return store.autoAssign({
    ...command,
    activity: {
      eventType: 'group.auto_assign',
      payload: {},
    },
  });
}

export async function autoAssignAllEligible(
  command: AutoAssignAllCommand,
  store: GroupAssignmentStore
) {
  const tournament = await store.findTournament(command.tournamentId);
  if (!tournament) throw new NotFoundError('Tournament not found');
  assertTournamentAction(tournament.status, 'group.autoAssign');

  return store.autoAssignAll(command);
}
