import { z } from 'zod';
import {
  CreateMatchSchema,
  GenerateBracketSchema,
  RegenerateBracketSchema,
  SetLockSchema,
  SetWinnerSchema,
  ShuffleBracketSchema,
  SwapParticipantsSchema,
  UpdateMatchSchema,
  UpdateScoreSchema,
} from './matches.dto';
import {
  create,
  deleteMatch,
  findByGroupId,
  findById,
  findByTournamentId,
  generateBracket,
  regenerateBracket,
  setLock,
  setWinner,
  shuffleBracket,
  swapParticipants,
  update,
  updateScore,
} from './matches.dal';
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
      return findByGroupId(input.groupId);
    }
    if (input.tournamentId) {
      return findByTournamentId(input.tournamentId);
    }
    throw new Error('Either groupId or tournamentId is required');
  });

export const getMatch = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const match = await findById(input.id);
    if (!match) throw new Error('Match not found');
    return match;
  });

export const createMatch = authedProcedure
  .input(CreateMatchSchema)
  .handler(async ({ input }) => {
    return create(input);
  });

export const updateMatch = authedProcedure
  .input(UpdateMatchSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return update(id, data);
  });

export const removeMatch = authedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    return deleteMatch(input.id);
  });

export const generateBracketEndpoint = authedProcedure
  .input(GenerateBracketSchema)
  .handler(async ({ input, context }) => {
    return generateBracket(input, context.user.id);
  });

export const shuffleBracketEndpoint = authedProcedure
  .input(ShuffleBracketSchema)
  .handler(async ({ input, context }) => {
    return shuffleBracket(input.groupId, context.user.id);
  });

export const regenerateBracketEndpoint = authedProcedure
  .input(RegenerateBracketSchema)
  .handler(async ({ input, context }) => {
    return regenerateBracket(input.groupId, context.user.id);
  });

export const setLockEndpoint = authedProcedure
  .input(SetLockSchema)
  .handler(async ({ input }) => {
    return setLock(input);
  });

export const updateScoreEndpoint = authedProcedure
  .input(UpdateScoreSchema)
  .handler(async ({ input, context }) => {
    return updateScore(input, context.user.id);
  });

export const setWinnerEndpoint = authedProcedure
  .input(SetWinnerSchema)
  .handler(async ({ input, context }) => {
    return setWinner(input, context.user.id);
  });

export const swapParticipantsEndpoint = authedProcedure
  .input(SwapParticipantsSchema)
  .handler(async ({ input, context }) => {
    return swapParticipants(input, context.user.id);
  });
