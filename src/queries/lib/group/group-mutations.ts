import type {
  AssignAthleteDTO,
  AutoAssignAllDTO,
  AutoAssignDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from '@/orpc/groups/dto';
import { client } from '@/orpc/client';

export function createGroup(data: { name: string; tournamentId: string }) {
  return client.group.create(data);
}

export function updateGroup(data: UpdateGroupDTO) {
  return client.group.update(data);
}

export function deleteGroup(data: { id: string }) {
  return client.group.delete(data);
}

export function autoAssignGroup(data: AutoAssignDTO) {
  return client.group.autoAssign(data);
}

export function autoAssignAllGroups(data: AutoAssignAllDTO) {
  return client.group.autoAssignAll(data);
}

export function assignAthlete(data: AssignAthleteDTO) {
  return client.group.assignAthlete(data);
}

export function unassignAthlete(data: UnassignAthleteDTO) {
  return client.group.unassignAthlete(data);
}
