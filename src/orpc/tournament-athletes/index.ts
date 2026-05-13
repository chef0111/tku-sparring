import { z } from 'zod';
import {
  BulkAddAthletesSchema,
  ListTournamentAthletesSchema,
  UpdateTournamentAthleteSchema,
} from './dto';
import { TournamentAthleteDAL } from './dal';
import { authedProcedure } from '@/orpc/middleware';
import { prisma } from '@/lib/db';

export const listTournamentAthletes = authedProcedure
  .input(ListTournamentAthletesSchema)
  .handler(async ({ input }) => {
    const athletes = await TournamentAthleteDAL.findByTournamentId(input);
    return athletes;
  });

export const bulkAddAthletes = authedProcedure
  .input(BulkAddAthletesSchema)
  .handler(async ({ input }) => {
    const { tournamentId, athleteProfileIds } = input;

    const profiles = await prisma.athleteProfile.findMany({
      where: { id: { in: athleteProfileIds } },
    });

    const created = await TournamentAthleteDAL.bulkCreate(
      tournamentId,
      profiles
    );
    const added = created.length;

    return { added, assigned: 0, unassigned: added };
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
  .input(z.object({ ids: z.array(z.string()).min(1) }))
  .handler(async ({ input }) => {
    const count = await TournamentAthleteDAL.bulkRemoveTournamentAthletes(
      input.ids
    );
    return count;
  });
