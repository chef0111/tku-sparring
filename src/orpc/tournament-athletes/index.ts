import { z } from 'zod';
import {
  BulkAddAthletesSchema,
  BulkRemoveTournamentAthletesSchema,
  ListTournamentAthletesSchema,
  UpdateTournamentAthleteSchema,
} from './dto';
import { TournamentAthleteDAL } from './dal';
import { bulkAddAthletesToTournament } from './bulk-add';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';

export const listTournamentAthletes = authorized
  .input(ListTournamentAthletesSchema)
  .handler(async ({ input }) => {
    const athletes = await TournamentAthleteDAL.findByTournamentId(input);
    return athletes;
  });

export const bulkAddAthletes = authorized
  .input(BulkAddAthletesSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return bulkAddAthletesToTournament({
      ...input,
      adminId: context.user.id,
    });
  });

export const updateTournamentAthleteRecord = authorized
  .input(UpdateTournamentAthleteSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const { id, ...data } = input;
    const athlete = await TournamentAthleteDAL.updateTournamentAthlete(
      id,
      data
    );
    return athlete;
  });

export const removeTournamentAthleteRecord = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const athlete = await TournamentAthleteDAL.removeTournamentAthlete(
      input.id
    );
    return athlete;
  });

export const bulkRemoveTournamentAthleteRecords = authorized
  .input(BulkRemoveTournamentAthletesSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const count = await TournamentAthleteDAL.bulkRemoveTournamentAthletes(
      input.ids
    );
    return count;
  });
