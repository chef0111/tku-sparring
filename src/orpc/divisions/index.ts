import { z } from 'zod';
import {
  AssignAthleteSchema,
  AutoAssignAllSchema,
  AutoAssignSchema,
  CreateDivisionSchema,
  UnassignAthleteSchema,
  UpdateDivisionSchema,
} from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import {
  assignAthleteToDivision as runAssignAthleteToDivision,
  autoAssignAllEligible as runAutoAssignAllEligible,
  autoAssignDivision as runAutoAssignDivision,
  unassignAthleteFromDivision as runUnassignAthleteFromDivision,
} from '@/server/application/divisions/use-cases/assign';
import {
  createDivision as runCreateDivision,
  deleteDivision as runDeleteDivision,
  updateDivision as runUpdateDivision,
} from '@/server/application/divisions/use-cases/lifecycle';
import {
  getDivision as runGetDivision,
  listDivisionsByTournament as runListDivisionsByTournament,
} from '@/server/application/divisions/use-cases/read';

export const listDivisions = authorized
  .input(z.object({ tournamentId: z.string() }))
  .handler(async ({ context, input }) =>
    runListDivisionsByTournament(input.tournamentId, context.repos.divisionRead)
  );

export const getDivision = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) =>
    runGetDivision(input.id, context.repos.divisionRead)
  );

export const createDivision = authorized
  .input(CreateDivisionSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runCreateDivision(input, context.repos.divisionLifecycle);
  });

export const updateDivision = authorized
  .input(UpdateDivisionSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runUpdateDivision(input, context.repos.divisionLifecycle);
  });

export const removeDivision = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ context, input }) => {
    assertSystemAdmin(context.user);
    return runDeleteDivision({ id: input.id }, context.repos.divisionLifecycle);
  });

export const autoAssignDivision = authorized
  .input(AutoAssignSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAutoAssignDivision(
      { ...input, adminId: context.user.id },
      context.repos.divisionAssign
    );
  });

export const autoAssignAllDivisions = authorized
  .input(AutoAssignAllSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAutoAssignAllEligible(
      { tournamentId: input.tournamentId, adminId: context.user.id },
      context.repos.divisionAssign
    );
  });

export const assignAthleteToDivision = authorized
  .input(AssignAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAssignAthleteToDivision(
      { ...input, adminId: context.user.id },
      context.repos.divisionAssign
    );
  });

export const unassignAthleteFromDivision = authorized
  .input(UnassignAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runUnassignAthleteFromDivision(
      { ...input, adminId: context.user.id },
      context.repos.divisionAssign
    );
  });
