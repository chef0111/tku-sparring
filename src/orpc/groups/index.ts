import { z } from 'zod';
import {
  AssignAthleteSchema,
  AutoAssignSchema,
  CreateGroupSchema,
  UnassignAthleteSchema,
  UpdateGroupSchema,
} from './groups.dto';
import {
  assignAthlete,
  autoAssign,
  create,
  deleteGroup,
  findById,
  findByTournamentId,
  unassignAthlete,
  update,
} from './groups.dal';
import { authedProcedure } from '@/orpc/middleware';

export const listGroups = authedProcedure
  .input(z.object({ tournamentId: z.string() }))
  .handler(async ({ input }) => {
    return findByTournamentId(input.tournamentId);
  });

export const getGroup = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const group = await findById(input.id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  });

export const createGroup = authedProcedure
  .input(CreateGroupSchema)
  .handler(async ({ input }) => {
    return create(input);
  });

export const updateGroup = authedProcedure
  .input(UpdateGroupSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return update(id, data);
  });

export const removeGroup = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return deleteGroup(input.id);
  });

export const autoAssignGroup = authedProcedure
  .input(AutoAssignSchema)
  .handler(async ({ input }) => {
    return autoAssign(input);
  });

export const assignAthleteToGroup = authedProcedure
  .input(AssignAthleteSchema)
  .handler(async ({ input }) => {
    return assignAthlete(input);
  });

export const unassignAthleteFromGroup = authedProcedure
  .input(UnassignAthleteSchema)
  .handler(async ({ input }) => {
    return unassignAthlete(input);
  });
