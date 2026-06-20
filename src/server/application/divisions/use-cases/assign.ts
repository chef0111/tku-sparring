import type {
  AssignAthleteCommand,
  AutoAssignAllCommand,
  AutoAssignCommand,
  UnassignAthleteCommand,
} from './assign-commands';
import type { DivisionAssignmentStore } from '../repositories/assign';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';

export async function assignAthleteToDivision(
  command: AssignAthleteCommand,
  store: DivisionAssignmentStore
) {
  const group = await store.findDivision(command.divisionId);
  if (!group) throw new NotFoundError('Division not found');
  assertTournamentAction(group.tournamentStatus, 'division.assignAthlete');

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
      eventType: 'division.athlete_assigned',
      payload: { divisionId: command.divisionId },
    },
  });
}

export async function unassignAthleteFromDivision(
  command: UnassignAthleteCommand,
  store: DivisionAssignmentStore
) {
  return store.unassignAthlete({
    ...command,
    activity: {
      eventType: 'division.athlete_unassigned',
      payload: {},
    },
  });
}

export async function autoAssignDivision(
  command: AutoAssignCommand,
  store: DivisionAssignmentStore
) {
  const group = await store.findDivision(command.divisionId);
  if (!group) throw new NotFoundError('Division not found');
  assertTournamentAction(group.tournamentStatus, 'division.autoAssign');

  return store.autoAssign({
    ...command,
    activity: {
      eventType: 'division.auto_assign',
      payload: {},
    },
  });
}

export async function autoAssignAllEligible(
  command: AutoAssignAllCommand,
  store: DivisionAssignmentStore
) {
  const tournament = await store.findTournament(command.tournamentId);
  if (!tournament) throw new NotFoundError('Tournament not found');
  assertTournamentAction(tournament.status, 'division.autoAssign');

  return store.autoAssignAll(command);
}
