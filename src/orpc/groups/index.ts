import { z } from 'zod';
import {
  AssignAthleteSchema,
  AutoAssignAllSchema,
  AutoAssignSchema,
  CreateGroupSchema,
  UnassignAthleteSchema,
  UpdateGroupSchema,
} from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import {
  assignAthleteToGroup as runAssignAthleteToGroup,
  autoAssignAllEligible as runAutoAssignAllEligible,
  autoAssignGroup as runAutoAssignGroup,
  unassignAthleteFromGroup as runUnassignAthleteFromGroup,
} from '@/server/application/groups/use-cases/assign';
import {
  createGroup as runCreateGroup,
  deleteGroup as runDeleteGroup,
  updateGroup as runUpdateGroup,
} from '@/server/application/groups/use-cases/lifecycle';
import {
  getGroup as runGetGroup,
  listGroupsByTournament as runListGroupsByTournament,
} from '@/server/application/groups/use-cases/read';

export const listGroups = authorized
  .input(z.object({ tournamentId: z.string() }))
  .handler(async ({ context, input }) =>
    runListGroupsByTournament(input.tournamentId, context.repos.groupRead)
  );

export const getGroup = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) =>
    runGetGroup(input.id, context.repos.groupRead)
  );

export const createGroup = authorized
  .input(CreateGroupSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runCreateGroup(input, context.repos.groupLifecycle);
  });

export const updateGroup = authorized
  .input(UpdateGroupSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runUpdateGroup(input, context.repos.groupLifecycle);
  });

export const removeGroup = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return runDeleteGroup({ id: input.id }, context.repos.groupLifecycle);
  });

export const autoAssignGroup = authorized
  .input(AutoAssignSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAutoAssignGroup(
      { ...input, adminId: context.user.id },
      context.repos.groupAssign
    );
  });

export const autoAssignAllGroups = authorized
  .input(AutoAssignAllSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAutoAssignAllEligible(
      { tournamentId: input.tournamentId, adminId: context.user.id },
      context.repos.groupAssign
    );
  });

export const assignAthleteToGroup = authorized
  .input(AssignAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAssignAthleteToGroup(
      { ...input, adminId: context.user.id },
      context.repos.groupAssign
    );
  });

export const unassignAthleteFromGroup = authorized
  .input(UnassignAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runUnassignAthleteFromGroup(
      { ...input, adminId: context.user.id },
      context.repos.groupAssign
    );
  });
