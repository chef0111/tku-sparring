import {
  assignAthleteToDivision,
  autoAssignAllDivisions,
  autoAssignDivision,
  createDivision,
  getDivision,
  listDivisions,
  removeDivision,
  unassignAthleteFromDivision,
  updateDivision,
} from './index';

export const divisionRouter = {
  list: listDivisions,
  get: getDivision,
  create: createDivision,
  update: updateDivision,
  delete: removeDivision,
  autoAssign: autoAssignDivision,
  autoAssignAll: autoAssignAllDivisions,
  assignAthlete: assignAthleteToDivision,
  unassignAthlete: unassignAthleteFromDivision,
} as const;
