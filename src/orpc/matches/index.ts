import { z } from 'zod';
import {
  AdminSetMatchStatusSchema,
  AssignSlotSchema,
  CreateCustomMatchSchema,
  GenerateBracketSchema,
  RegenerateBracketSchema,
  ResetBracketSchema,
  SetLockSchema,
  SetWinnerSchema,
  ShuffleBracketSchema,
  SwapParticipantsSchema,
  SwapSlotsSchema,
  UpdateScoreSchema,
} from './dto';
import {
  generateBracket as runGenerateBracket,
  regenerateBracket as runRegenerateBracket,
  resetBracket as runResetBracket,
  shuffleBracket as runShuffleBracket,
} from './bracket/bracket-lifecycle';
import { createCustomMatch as runCreateCustomMatch } from './create-custom-match';
import { deleteCustomMatch as runDeleteCustomMatch } from './delete-custom-match';
import { MatchDAL } from './dal';
import { authorized } from '@/orpc/middleware';
import { assertSystemAdmin } from '@/orpc/policies/auth';
import {
  adminSetMatchStatus as runAdminSetMatchStatus,
  setMatchWinner as runSetMatchWinner,
  updateMatchScore as runUpdateMatchScore,
} from '@/server/application/matches/use-cases/transition';

export const listMatches = authorized
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

export const getMatch = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const match = await MatchDAL.findById(input.id);
    if (!match) {
      throw new Error('Match not found');
    }
    return match;
  });

export const createCustomMatch = authorized
  .input(CreateCustomMatchSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runCreateCustomMatch(input, context.user.id);
  });

export const adminSetMatchStatus = authorized
  .input(AdminSetMatchStatusSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAdminSetMatchStatus(
      { ...input, adminId: context.user.id },
      context.repos.matchTransition
    );
  });

export const removeMatch = authorized
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runDeleteCustomMatch(input.id, context.user.id);
  });

export const generateBracket = authorized
  .input(GenerateBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const matches = await runGenerateBracket(input, context.user.id);
    return matches;
  });

export const shuffleBracket = authorized
  .input(ShuffleBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const matches = await runShuffleBracket(input.groupId, context.user.id);
    return matches;
  });

export const regenerateBracket = authorized
  .input(RegenerateBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const matches = await runRegenerateBracket(input.groupId, context.user.id);
    return matches;
  });

export const resetBracket = authorized
  .input(ResetBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const matches = await runResetBracket(input.groupId, context.user.id);
    return matches;
  });

export const setLock = authorized
  .input(SetLockSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const match = await MatchDAL.setLock(input);
    return match;
  });

export const updateScore = authorized
  .input(UpdateScoreSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const score = await runUpdateMatchScore(
      { ...input, adminId: context.user.id },
      context.repos.matchTransition
    );
    return score;
  });

export const setWinner = authorized
  .input(SetWinnerSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const winner = await runSetMatchWinner(
      { ...input, adminId: context.user.id },
      context.repos.matchTransition
    );
    return winner;
  });

export const swapParticipants = authorized
  .input(SwapParticipantsSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const participants = await MatchDAL.swapParticipants(
      input,
      context.user.id
    );
    return participants;
  });

export const assignSlot = authorized
  .input(AssignSlotSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const slot = await MatchDAL.assignSlot(input, context.user.id);
    return slot;
  });

export const swapSlots = authorized
  .input(SwapSlotsSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    const slots = await MatchDAL.swapSlots(input, context.user.id);
    return slots;
  });
