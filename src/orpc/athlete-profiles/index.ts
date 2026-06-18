import { z } from 'zod';
import {
  AthleteProfilesSchema,
  BulkDeleteAthleteProfilesSchema,
  CheckDuplicateSchema,
  CreateAthleteProfileSchema,
  UpdateAthleteProfileSchema,
} from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import { bulkRemoveProfiles } from '@/server/application/athlete-profiles/use-cases/bulk-remove';
import { createProfile } from '@/server/application/athlete-profiles/use-cases/create';
import { runDedupCheck } from '@/server/application/athlete-profiles/use-cases/dedup';
import { getProfile } from '@/server/application/athlete-profiles/use-cases/get';
import { listProfiles } from '@/server/application/athlete-profiles/use-cases/list';
import { removeProfile } from '@/server/application/athlete-profiles/use-cases/remove';
import { updateProfile } from '@/server/application/athlete-profiles/use-cases/update';

export const listAthleteProfiles = authorized
  .input(AthleteProfilesSchema)
  .handler(async ({ context, input }) =>
    listProfiles(input, context.repos.athleteProfile)
  );

export const getAthleteProfile = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) =>
    getProfile(input.id, context.repos.athleteProfile)
  );

export const createAthleteProfile = authorized
  .input(CreateAthleteProfileSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return createProfile(input, context.repos.athleteProfile);
  });

export const checkDuplicate = authorized
  .input(CheckDuplicateSchema)
  .handler(async ({ context, input }) =>
    runDedupCheck(
      {
        athleteCode: input.athleteCode,
        name: input.name,
        affiliation: input.affiliation,
        weight: input.weight,
        beltLevel: input.beltLevel,
        excludeId: input.excludeId,
      },
      context.repos.athleteProfile
    )
  );

export const updateAthleteProfile = authorized
  .input(UpdateAthleteProfileSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const { id, ...data } = input;
    return updateProfile(id, data, context.repos.athleteProfile);
  });

export const removeAthleteProfile = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return removeProfile(input.id, context.repos.athleteProfile);
  });

export const bulkDeleteAthleteProfiles = authorized
  .input(BulkDeleteAthleteProfilesSchema)
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return bulkRemoveProfiles({ ids: input.ids }, context.repos.athleteProfile);
  });
