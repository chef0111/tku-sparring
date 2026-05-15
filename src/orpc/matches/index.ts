import { z } from 'zod';
import {
  AdminSetMatchStatusSchema,
  AssignSlotSchema,
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
import { MatchDAL } from './dal';
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

export const updateMatch = authedProcedure
  .input(UpdateMatchSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const match = await MatchDAL.update(id, data);
    return match;
  });

export const adminSetMatchStatusEndpoint = authedProcedure
  .input(AdminSetMatchStatusSchema)
  .handler(async ({ input, context }) => {
    return MatchDAL.adminSetMatchStatus(input, context.user.id);
  });

export const removeMatch = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const match = await MatchDAL.deleteMatch(input.id);
    return match;
  });

export const generateBracketEndpoint = authedProcedure
  .input(GenerateBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await MatchDAL.generateBracket(input, context.user.id);
    return matches;
  });

export const shuffleBracketEndpoint = authedProcedure
  .input(ShuffleBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await MatchDAL.shuffleBracket(
      input.groupId,
      context.user.id
    );
    return matches;
  });

export const regenerateBracketEndpoint = authedProcedure
  .input(RegenerateBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await MatchDAL.regenerateBracket(
      input.groupId,
      context.user.id
    );
    return matches;
  });

export const resetBracketEndpoint = authedProcedure
  .input(ResetBracketSchema)
  .handler(async ({ input, context }) => {
    const matches = await MatchDAL.resetBracket(input.groupId, context.user.id);
    return matches;
  });

export const setLockEndpoint = authedProcedure
  .input(SetLockSchema)
  .handler(async ({ input }) => {
    const match = await MatchDAL.setLock(input);
    return match;
  });

export const updateScoreEndpoint = authedProcedure
  .input(UpdateScoreSchema)
  .handler(async ({ input, context }) => {
    const score = await MatchDAL.updateScore(input, context.user.id);
    return score;
  });

export const setWinnerEndpoint = authedProcedure
  .input(SetWinnerSchema)
  .handler(async ({ input, context }) => {
    const winner = await MatchDAL.setWinner(input, context.user.id);
    return winner;
  });

export const swapParticipantsEndpoint = authedProcedure
  .input(SwapParticipantsSchema)
  .handler(async ({ input, context }) => {
    const participants = await MatchDAL.swapParticipants(
      input,
      context.user.id
    );
    return participants;
  });

export const assignSlotEndpoint = authedProcedure
  .input(AssignSlotSchema)
  .handler(async ({ input, context }) => {
    const slot = await MatchDAL.assignSlot(input, context.user.id);
    return slot;
  });

export const swapSlotsEndpoint = authedProcedure
  .input(SwapSlotsSchema)
  .handler(async ({ input, context }) => {
    const slots = await MatchDAL.swapSlots(input, context.user.id);
    return slots;
  });
