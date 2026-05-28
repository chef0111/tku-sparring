import { z } from 'zod';
import {
  BulkAddAthletesSchema,
  BulkRemoveTournamentAthletesSchema,
  ListTournamentAthletesSchema,
  UpdateTournamentAthleteSchema,
} from './dto';
import { TournamentAthleteDAL } from './dal';
import { bulkAddAthletesToTournament } from './bulk-add';
import { authedProcedure } from '@/orpc/middleware';

export const listTournamentAthletes = authedProcedure
  .input(ListTournamentAthletesSchema)
  .handler(async ({ input }) => {
    const athletes = await TournamentAthleteDAL.findByTournamentId(input);
    return athletes;
  });

export const bulkAddAthletes = authedProcedure
  .input(BulkAddAthletesSchema)
  .handler(async ({ input, context }) => {
    return bulkAddAthletesToTournament({
      ...input,
      adminId: context.user.id,
    });
  });

export const updateTournamentAthleteRecord = authedProcedure
  .input(UpdateTournamentAthleteSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const athlete = await TournamentAthleteDAL.updateTournamentAthlete(
      id,
      data
    );
    return athlete;
  });

export const removeTournamentAthleteRecord = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const athlete = await TournamentAthleteDAL.removeTournamentAthlete(
      input.id
    );
    return athlete;
  });

export const bulkRemoveTournamentAthleteRecords = authedProcedure
  .input(BulkRemoveTournamentAthletesSchema)
  .handler(async ({ input }) => {
    const count = await TournamentAthleteDAL.bulkRemoveTournamentAthletes(
      input.ids
    );
    return count;
  });
