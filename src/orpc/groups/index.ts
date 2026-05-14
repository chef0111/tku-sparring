import { z } from 'zod';
import {
  AssignAthleteSchema,
  AutoAssignSchema,
  CreateGroupSchema,
  UnassignAthleteSchema,
  UpdateGroupSchema,
} from './dto';
import { GroupDAL } from './dal';
import { authedProcedure } from '@/orpc/middleware';

export const listGroups = authedProcedure
  .input(z.object({ tournamentId: z.string() }))
  .handler(async ({ input }) => {
    const groups = await GroupDAL.findByTournamentId(input.tournamentId);
    return groups;
  });

export const getGroup = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const group = await GroupDAL.findById(input.id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  });

export const createGroup = authedProcedure
  .input(CreateGroupSchema)
  .handler(async ({ input }) => {
    const group = await GroupDAL.create(input);
    return group;
  });

export const updateGroup = authedProcedure
  .input(UpdateGroupSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const group = await GroupDAL.update(id, data);
    return group;
  });

export const removeGroup = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const group = await GroupDAL.deleteGroup(input.id);
    return group;
  });

export const autoAssignGroup = authedProcedure
  .input(AutoAssignSchema)
  .handler(async ({ input, context }) => {
    const result = await GroupDAL.autoAssign({
      ...input,
      adminId: context.user.id,
    });
    return result;
  });

export const assignAthleteToGroup = authedProcedure
  .input(AssignAthleteSchema)
  .handler(async ({ input, context }) => {
    const athlete = await GroupDAL.assignAthlete({
      ...input,
      adminId: context.user.id,
    });
    return athlete;
  });

export const unassignAthleteFromGroup = authedProcedure
  .input(UnassignAthleteSchema)
  .handler(async ({ input, context }) => {
    const athlete = await GroupDAL.unassignAthlete({
      ...input,
      adminId: context.user.id,
    });
    return athlete;
  });
