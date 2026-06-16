import { z } from 'zod';
import {
  AssignAthleteSchema,
  AutoAssignAllSchema,
  AutoAssignSchema,
  CreateGroupSchema,
  UnassignAthleteSchema,
  UpdateGroupSchema,
} from './dto';
import { GroupDAL } from './dal';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';

export const listGroups = authorized
  .input(z.object({ tournamentId: z.string() }))
  .handler(async ({ input }) => {
    const groups = await GroupDAL.findByTournamentId(input.tournamentId);
    return groups;
  });

export const getGroup = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const group = await GroupDAL.findById(input.id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  });

export const createGroup = authorized
  .input(CreateGroupSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const group = await GroupDAL.create(input);
    return group;
  });

export const updateGroup = authorized
  .input(UpdateGroupSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const { id, ...data } = input;
    const group = await GroupDAL.update(id, data);
    return group;
  });

export const removeGroup = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const group = await GroupDAL.deleteGroup(input.id);
    return group;
  });

export const autoAssignGroup = authorized
  .input(AutoAssignSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const result = await GroupDAL.autoAssign({
      ...input,
      adminId: context.user.id,
    });
    return result;
  });

export const autoAssignAllGroups = authorized
  .input(AutoAssignAllSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return GroupDAL.autoAssignAllEligible({
      tournamentId: input.tournamentId,
      adminId: context.user.id,
    });
  });

export const assignAthleteToGroup = authorized
  .input(AssignAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const athlete = await GroupDAL.assignAthlete({
      ...input,
      adminId: context.user.id,
    });
    return athlete;
  });

export const unassignAthleteFromGroup = authorized
  .input(UnassignAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const athlete = await GroupDAL.unassignAthlete({
      ...input,
      adminId: context.user.id,
    });
    return athlete;
  });
