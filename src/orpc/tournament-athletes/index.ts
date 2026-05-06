import { z } from 'zod';
import {
  BulkAddAthletesSchema,
  ListTournamentAthletesSchema,
  UpdateTournamentAthleteSchema,
} from './tournament-athletes.dto';
import {
  bulkCreate,
  bulkRemoveTournamentAthletes,
  findByTournamentId,
  removeTournamentAthlete,
  updateTournamentAthlete,
} from './tournament-athletes.dal';
import { authedProcedure } from '@/orpc/middleware';
import { prisma } from '@/lib/db';

export const listTournamentAthletes = authedProcedure
  .input(ListTournamentAthletesSchema)
  .handler(async ({ input }) => {
    return findByTournamentId(input);
  });

export const bulkAddAthletes = authedProcedure
  .input(BulkAddAthletesSchema)
  .handler(async ({ input }) => {
    const { tournamentId, athleteProfileIds } = input;

    const profiles = await prisma.athleteProfile.findMany({
      where: { id: { in: athleteProfileIds } },
    });

    const created = await bulkCreate(tournamentId, profiles);
    const added = created.length;

    // autoAssign stub: group constraints not implemented yet (Groups tab is a future item)
    return { added, assigned: 0, unassigned: added };
  });

export const updateTournamentAthleteRecord = authedProcedure
  .input(UpdateTournamentAthleteSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return updateTournamentAthlete(id, data);
  });

export const removeTournamentAthleteRecord = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return removeTournamentAthlete(input.id);
  });

export const bulkRemoveTournamentAthleteRecords = authedProcedure
  .input(z.object({ ids: z.array(z.string()).min(1) }))
  .handler(async ({ input }) => {
    return bulkRemoveTournamentAthletes(input.ids);
  });
