import {
  bulkDeleteAthleteProfiles,
  checkDuplicate,
  createAthleteProfile,
  listAthleteProfiles,
  removeAthleteProfile,
  updateAthleteProfile,
} from './index';

export const athleteProfileRouter = {
  list: listAthleteProfiles,
  create: createAthleteProfile,
  checkDuplicate,
  update: updateAthleteProfile,
  delete: removeAthleteProfile,
  bulkDelete: bulkDeleteAthleteProfiles,
} as const;
