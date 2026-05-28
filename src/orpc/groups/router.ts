import {
  assignAthleteToGroup,
  autoAssignAllGroups,
  autoAssignGroup,
  createGroup,
  getGroup,
  listGroups,
  removeGroup,
  unassignAthleteFromGroup,
  updateGroup,
} from './index';

export const groupRouter = {
  list: listGroups,
  get: getGroup,
  create: createGroup,
  update: updateGroup,
  delete: removeGroup,
  autoAssign: autoAssignGroup,
  autoAssignAll: autoAssignAllGroups,
  assignAthlete: assignAthleteToGroup,
  unassignAthlete: unassignAthleteFromGroup,
} as const;
