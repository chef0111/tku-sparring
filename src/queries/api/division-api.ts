import type {
  AssignAthleteDTO,
  AutoAssignAllDTO,
  AutoAssignDTO,
  UnassignAthleteDTO,
  UpdateDivisionDTO,
} from '@/orpc/divisions/dto';
import { client } from '@/orpc/client';

export function listDivisions(tournamentId: string) {
  return client.division.list({ tournamentId });
}

export function createDivision(data: { name: string; tournamentId: string }) {
  return client.division.create(data);
}

export function updateDivision(data: UpdateDivisionDTO) {
  return client.division.update(data);
}

export function deleteDivision(data: { id: string }) {
  return client.division.delete(data);
}

export function autoAssignDivision(data: AutoAssignDTO) {
  return client.division.autoAssign(data);
}

export function autoAssignAllDivisions(data: AutoAssignAllDTO) {
  return client.division.autoAssignAll(data);
}

export function assignAthlete(data: AssignAthleteDTO) {
  return client.division.assignAthlete(data);
}

export function unassignAthlete(data: UnassignAthleteDTO) {
  return client.division.unassignAthlete(data);
}
