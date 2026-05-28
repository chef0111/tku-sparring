import { z } from 'zod';
import {
  AdminSetMatchStatusSchema,
  AssignSlotSchema,
  CreateCustomMatchSchema,
  CreateMatchSchema,
  GenerateBracketSchema,
  RegenerateBracketSchema,
  ResetBracketSchema,
  SetLockSchema,
  SetWinnerSchema,
  ShuffleBracketSchema,
  SwapParticipantsSchema,
  SwapSlotsSchema,
  UpdateMatchSchema,
  UpdateScoreSchema,
} from './dto';
import {
  generateBracket as runGenerateBracket,
  regenerateBracket as runRegenerateBracket,
  resetBracket as runResetBracket,
  shuffleBracket as runShuffleBracket,
} from './bracket/bracket-lifecycle';
import { MatchDAL } from './dal';
import { throwMatchBadRequest } from './match-domain-error';
import { authedProcedure } from '@/orpc/middleware';

export const listMatches = authedProcedure
  .input(
    z.object({
      groupId: z.string().optional(),
      tournamentId: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    if (input.groupId) {
      const matches = await MatchDAL.findByGroupId(input.groupId);
      return matches;
    }
    if (input.tournamentId) {
      const matches = await MatchDAL.findByTournamentId(input.tournamentId);
      return matches;
    }
    throw new Error('Either groupId or tournamentId is required');
  });

export const getMatch = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const match = await MatchDAL.findById(input.id);
    if (!match) {
      throw new Error('Match not found');
    }
    return match;
  });

export const createMatch = authedProcedure
  .input(CreateMatchSchema)
  .handler(async ({ input }) => {
    const match = await MatchDAL.create(input);
    return match;
  });

export const createCustomMatch = authedProcedure
  .input(CreateCustomMatchSchema)
  .handler(async ({ input, context }) => {
    return MatchDAL.createCustom(input, context.user.id);
  });

export const updateMatch = authedProcedure
  .input(UpdateMatchSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const match = await MatchDAL.update(id, data);
    return match;
  });

export const adminSetMatchStatus = authedProcedure
  .input(AdminSetMatchStatusSchema)
  .handler(async ({ input, context }) => {
    return MatchDAL.adminSetMatchStatus(input, context.user.id);
  });

export const removeMatch = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const existing = await MatchDAL.findById(input.id);
    if (!existing) throwMatchBadRequest('Match not found');
    if (existing.kind !== 'custom') {
      throwMatchBadRequest('Only custom matches can be deleted');
    }
    return MatchDAL.deleteMatch(input.id);
  });

export const generateBracket = authedProcedure
  .input(GenerateBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await runGenerateBracket(input, context.user.id);
    return matches;
  });

export const shuffleBracket = authedProcedure
  .input(ShuffleBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await runShuffleBracket(input.groupId, context.user.id);
    return matches;
  });

export const regenerateBracket = authedProcedure
  .input(RegenerateBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await runRegenerateBracket(input.groupId, context.user.id);
    return matches;
  });

export const resetBracket = authedProcedure
  .input(ResetBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await runResetBracket(input.groupId, context.user.id);
    return matches;
  });

export const setLock = authedProcedure
  .input(SetLockSchema)
  .handler(async ({ input }) => {
    const match = await MatchDAL.setLock(input);
    return match;
  });

export const updateScore = authedProcedure
  .input(UpdateScoreSchema)
  .handler(async ({ input, context }) => {
    const score = await MatchDAL.updateScore(input, context.user.id);
    return score;
  });

export const setWinner = authedProcedure
  .input(SetWinnerSchema)
  .handler(async ({ input, context }) => {
    const winner = await MatchDAL.setWinner(input, context.user.id);
    return winner;
  });

export const swapParticipants = authedProcedure
  .input(SwapParticipantsSchema)
  .handler(async ({ input, context }) => {
    const participants = await MatchDAL.swapParticipants(
      input,
      context.user.id
    );
    return participants;
  });

export const assignSlot = authedProcedure
  .input(AssignSlotSchema)
  .handler(async ({ input, context }) => {
    const slot = await MatchDAL.assignSlot(input, context.user.id);
    return slot;
  });

export const swapSlots = authedProcedure
  .input(SwapSlotsSchema)
  .handler(async ({ input, context }) => {
    const slots = await MatchDAL.swapSlots(input, context.user.id);
    return slots;
  });
