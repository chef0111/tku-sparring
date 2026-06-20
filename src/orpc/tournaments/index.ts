import { z } from 'zod';
import {
  CreateTournamentSchema,
  EnsureArenaSlotSchema,
  ListTournamentsSchema,
  MoveDivisionArenaSchema,
  RetireArenaSchema,
  SetArenaDivisionOrderSchema,
  SetTournamentStatusSchema,
  UpdateTournamentSchema,
} from './dto';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import { NotFoundError } from '@/server/application/errors';
import {
  createTournament as runCreateTournament,
  deleteTournament as runDeleteTournament,
  setTournamentStatus as runSetTournamentStatus,
  updateTournament as runUpdateTournament,
} from '@/server/application/tournaments/use-cases/lifecycle';
import {
  ensureArenaSlot as runEnsureArenaSlot,
  moveDivisionBetweenArenas as runMoveDivisionBetweenArenas,
  retireArena as runRetireArena,
  setArenaDivisionOrder as runSetArenaDivisionOrder,
} from '@/server/application/tournaments/use-cases/arena-order';

export const listTournaments = authorized
  .input(ListTournamentsSchema)
  .handler(async ({ input, context }) => {
    return context.repos.tournamentRead.list(input);
  });

export const getTournament = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const tournament = await context.repos.tournamentRead.findById(input.id);
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    return tournament;
  });

export const createTournament = authorized
  .input(CreateTournamentSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runCreateTournament(input, context.repos.tournamentLifecycle);
  });

export const updateTournament = authorized
  .input(UpdateTournamentSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const { id, ...data } = input;
    return runUpdateTournament(
      { id, ...data },
      context.repos.tournamentLifecycle
    );
  });

export const setTournamentStatus = authorized
  .input(SetTournamentStatusSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runSetTournamentStatus(
      { ...input, adminId: context.user.id },
      context.repos.tournamentLifecycle
    );
  });

export const setArenaDivisionOrder = authorized
  .input(SetArenaDivisionOrderSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runSetArenaDivisionOrder(input, context.repos.tournamentArenaOrder);
  });

export const moveDivisionArena = authorized
  .input(MoveDivisionArenaSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runMoveDivisionBetweenArenas(
      input,
      context.repos.tournamentArenaOrder
    );
  });

export const ensureArenaSlot = authorized
  .input(EnsureArenaSlotSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runEnsureArenaSlot(input, context.repos.tournamentArenaOrder);
  });

export const retireArena = authorized
  .input(RetireArenaSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runRetireArena(input, context.repos.tournamentArenaOrder);
  });

export const removeTournament = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runDeleteTournament(
      { id: input.id, adminId: context.user.id },
      context.repos.tournamentLifecycle
    );
  });
