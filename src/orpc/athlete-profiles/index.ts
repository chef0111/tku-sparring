import { z } from 'zod';
import {
  CheckDuplicateSchema,
  CreateAthleteProfileSchema,
  ListAthleteProfilesSchema,
  UpdateAthleteProfileSchema,
} from './athlete-profiles.dto';
import {
  create,
  deleteProfile,
  findById,
  findMany,
  update,
} from './athlete-profiles.dal';
import { runDedupCheck } from './athlete-profiles.dedup';
import { authedProcedure } from '@/orpc/middleware';

export const listAthleteProfiles = authedProcedure
  .input(ListAthleteProfilesSchema)
  .handler(async ({ input }) => {
    return findMany(input);
  });

export const getAthleteProfile = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const profile = await findById(input.id);
    if (!profile) throw new Error('Athlete profile not found');
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

    return create(data);
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
    return update(id, data);
  });

export const removeAthleteProfile = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return deleteProfile(input.id);
  });
