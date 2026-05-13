import { z } from 'zod';
import {
  AthleteProfilesSchema,
  BulkDeleteAthleteProfilesSchema,
  CheckDuplicateSchema,
  CreateAthleteProfileSchema,
  UpdateAthleteProfileSchema,
} from './dto';
import { AthleteProfileDAL } from './dal';
import { runDedupCheck } from './dedup';
import { authedProcedure } from '@/orpc/middleware';

export const listAthleteProfiles = authedProcedure
  .input(AthleteProfilesSchema)
  .handler(async ({ input }) => {
    const profiles = await AthleteProfileDAL.findMany(input);
    return profiles;
  });

export const getAthleteProfile = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const profile = await AthleteProfileDAL.findById(input.id);
    if (!profile) {
      throw new Error('Athlete profile not found');
    }
    return profile;
  });

export const createAthleteProfile = authedProcedure
  .input(CreateAthleteProfileSchema)
  .handler(async ({ input }) => {
    const { confirmDuplicate, ...data } = input;

    if (!confirmDuplicate) {
      const dedup = await runDedupCheck({
        athleteCode: data.athleteCode,
        name: data.name,
        affiliation: data.affiliation,
        weight: data.weight,
        beltLevel: data.beltLevel,
      });

      if (dedup.isHardBlock) {
        throw new Error(
          'DUPLICATE_ATHLETE_CODE_NAME: An athlete with this code and name already exists'
        );
      }

      if (dedup.isDuplicate) {
        throw new Error(
          `POSSIBLE_DUPLICATE: ${JSON.stringify(dedup.matches.map((d) => d.id))}`
        );
      }
    }

    const profile = await AthleteProfileDAL.create(data);
    return profile;
  });

export const checkDuplicate = authedProcedure
  .input(CheckDuplicateSchema)
  .handler(async ({ input }) => {
    return runDedupCheck({
      athleteCode: input.athleteCode,
      name: input.name,
      affiliation: input.affiliation,
      weight: input.weight,
      beltLevel: input.beltLevel,
      excludeId: input.excludeId,
    });
  });

export const updateAthleteProfile = authedProcedure
  .input(UpdateAthleteProfileSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const profile = await AthleteProfileDAL.update(id, data);
    return profile;
  });

export const removeAthleteProfile = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const profile = await AthleteProfileDAL.deleteProfile(input.id);
    return profile;
  });

export const bulkDeleteAthleteProfiles = authedProcedure
  .input(BulkDeleteAthleteProfilesSchema)
  .handler(async ({ input }) => {
    const count = await AthleteProfileDAL.deleteProfiles(input.ids);
    return count;
  });
