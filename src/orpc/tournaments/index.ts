import { z } from 'zod';
import {
  CreateTournamentSchema,
  ListTournamentsSchema,
  SetTournamentStatusSchema,
  UpdateTournamentSchema,
} from './dto';
import { TournamentDAL } from './dal';
import { authedProcedure } from '@/orpc/middleware';

export const listTournaments = authedProcedure
  .input(ListTournamentsSchema)
  .handler(async ({ input }) => {
    return TournamentDAL.findMany(input);
  });

export const getTournament = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const tournament = await TournamentDAL.findById(input.id);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    return tournament;
  });

export const createTournament = authedProcedure
  .input(CreateTournamentSchema)
  .handler(async ({ input }) => {
    const tournament = await TournamentDAL.create(input);
    return tournament;
  });

export const updateTournament = authedProcedure
  .input(UpdateTournamentSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const tournament = await TournamentDAL.update(id, data);
    return tournament;
  });

export const setTournamentStatus = authedProcedure
  .input(SetTournamentStatusSchema)
  .handler(async ({ input, context }) => {
    const tournament = await TournamentDAL.setStatus({
      ...input,
      adminId: context.user.id,
    });
    return tournament;
  });

export const removeTournament = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const tournament = await TournamentDAL.deleteTournament(input.id);
    return tournament;
  });
