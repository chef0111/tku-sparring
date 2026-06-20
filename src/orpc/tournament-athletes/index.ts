import { z } from 'zod';
import {
  BulkAddAthletesSchema,
  BulkRemoveTournamentAthletesSchema,
  ListTournamentAthletesSchema,
  UpdateTournamentAthleteSchema,
} from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import { bulkAddAthletes as runBulkAddAthletes } from '@/server/application/tournament-athletes/use-cases/bulk-add';
import { bulkRemoveTournamentAthletes as runBulkRemove } from '@/server/application/tournament-athletes/use-cases/bulk-remove';
import { listTournamentAthletes as runList } from '@/server/application/tournament-athletes/use-cases/list';
import { removeTournamentAthlete as runRemove } from '@/server/application/tournament-athletes/use-cases/remove';
import { updateTournamentAthlete as runUpdate } from '@/server/application/tournament-athletes/use-cases/update';

export const listTournamentAthletes = authorized
  .input(ListTournamentAthletesSchema)
  .handler(async ({ input, context }) => {
    return runList(input, context.repos.tournamentAthlete);
  });

export const bulkAddAthletes = authorized
  .input(BulkAddAthletesSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runBulkAddAthletes(
      { ...input, adminId: context.user.id },
      context.repos.tournamentAthlete,
      context.repos.divisionAssign
    );
  });

export const updateTournamentAthleteRecord = authorized
  .input(UpdateTournamentAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runUpdate(input, context.repos.tournamentAthlete);
  });

export const removeTournamentAthleteRecord = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runRemove({ id: input.id }, context.repos.tournamentAthlete);
  });

export const bulkRemoveTournamentAthleteRecords = authorized
  .input(BulkRemoveTournamentAthletesSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runBulkRemove(input, context.repos.tournamentAthlete);
  });
