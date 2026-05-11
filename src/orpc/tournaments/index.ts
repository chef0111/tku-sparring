import { z } from 'zod';
import {
  CreateTournamentSchema,
  ListTournamentsSchema,
  SetTournamentStatusSchema,
  UpdateTournamentSchema,
} from './tournaments.dto';
import {
  create,
  deleteTournament,
  findById,
  findMany,
  setStatus,
  update,
} from './tournaments.dal';
import { authedProcedure } from '@/orpc/middleware';

export const listTournaments = authedProcedure
  .input(ListTournamentsSchema)
  .handler(async ({ input }) => {
    return findMany(input);
  });

export const getTournament = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const tournament = await findById(input.id);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    return tournament;
  });

export const createTournament = authedProcedure
  .input(CreateTournamentSchema)
  .handler(async ({ input }) => {
    return create(input);
  });

export const updateTournament = authedProcedure
  .input(UpdateTournamentSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return update(id, data);
  });

export const setTournamentStatus = authedProcedure
  .input(SetTournamentStatusSchema)
  .handler(async ({ input, context }) => {
    return setStatus({
      ...input,
      adminId: context.user.id,
    });
  });

export const removeTournament = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return deleteTournament(input.id);
  });
