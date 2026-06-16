import { z } from 'zod';
import {
  CreateTournamentSchema,
  EnsureArenaSlotSchema,
  ListTournamentsSchema,
  MoveGroupArenaSchema,
  RetireArenaSchema,
  SetArenaGroupOrderSchema,
  SetTournamentStatusSchema,
  UpdateTournamentSchema,
} from './dto';
import { TournamentDAL } from './dal';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';

export const listTournaments = authorized
  .input(ListTournamentsSchema)
  .handler(async ({ input }) => {
    return TournamentDAL.findMany(input);
  });

export const getTournament = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const tournament = await TournamentDAL.findById(input.id);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    return tournament;
  });

export const createTournament = authorized
  .input(CreateTournamentSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const tournament = await TournamentDAL.create(input);
    return tournament;
  });

export const updateTournament = authorized
  .input(UpdateTournamentSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const { id, ...data } = input;
    const tournament = await TournamentDAL.update(id, data);
    return tournament;
  });

export const setTournamentStatus = authorized
  .input(SetTournamentStatusSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const tournament = await TournamentDAL.setStatus({
      ...input,
      adminId: context.user.id,
    });
    return tournament;
  });

export const setArenaGroupOrder = authorized
  .input(SetArenaGroupOrderSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return TournamentDAL.setArenaGroupOrder(input);
  });

export const moveGroupArena = authorized
  .input(MoveGroupArenaSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return TournamentDAL.moveGroupBetweenArenas(input);
  });

export const ensureArenaSlot = authorized
  .input(EnsureArenaSlotSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return TournamentDAL.ensureArenaSlot(input);
  });

export const retireArena = authorized
  .input(RetireArenaSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return TournamentDAL.retireArena(input);
  });

export const removeTournament = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const tournament = await TournamentDAL.deleteTournament(
      input.id,
      context.user.id
    );
    return tournament;
  });
