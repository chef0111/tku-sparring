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
import { MatchDAL } from './dal';
import {
  generateBracket as runGenerateBracket,
  regenerateBracket as runRegenerateBracket,
  resetBracket as runResetBracket,
  shuffleBracket as runShuffleBracket,
} from '@/server/application/matches/use-cases/bracket-lifecycle';
import {
  assignSlot as runAssignSlot,
  setLock as runSetLock,
  swapSlots as runSwapSlots,
} from '@/server/application/matches/use-cases/round0-slot';
import { swapParticipants as runSwapParticipants } from '@/server/application/matches/use-cases/swap-participants';
import {
  createCustomMatch as runCreateCustomMatch,
  deleteCustomMatch as runDeleteCustomMatch,
} from '@/server/application/matches/use-cases/custom';
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
    return runCreateCustomMatch(
      { ...input, adminId: context.user.id },
      context.repos.customMatch
    );
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
    return runDeleteCustomMatch(
      { matchId: input.id, adminId: context.user.id },
      context.repos.customMatch
    );
  });

export const generateBracket = authorized
  .input(GenerateBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runGenerateBracket(
      { ...input, adminId: context.user.id },
      context.repos.bracketLifecycle
    );
  });

export const shuffleBracket = authorized
  .input(ShuffleBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runShuffleBracket(
      { groupId: input.groupId, adminId: context.user.id },
      context.repos.bracketLifecycle
    );
  });

export const regenerateBracket = authorized
  .input(RegenerateBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runRegenerateBracket(
      { groupId: input.groupId, adminId: context.user.id },
      context.repos.bracketLifecycle
    );
  });

export const resetBracket = authorized
  .input(ResetBracketSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runResetBracket(
      { groupId: input.groupId, adminId: context.user.id },
      context.repos.bracketLifecycle
    );
  });

export const setLock = authorized
  .input(SetLockSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runSetLock(input, context.repos.round0Slot);
  });

export const updateScore = authorized
  .input(UpdateScoreSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runUpdateMatchScore(
      { ...input, adminId: context.user.id },
      context.repos.matchTransition
    );
  });

export const setWinner = authorized
  .input(SetWinnerSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runSetMatchWinner(
      { ...input, adminId: context.user.id },
      context.repos.matchTransition
    );
  });

export const swapParticipants = authorized
  .input(SwapParticipantsSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runSwapParticipants(
      { ...input, adminId: context.user.id },
      context.repos.matchParticipant
    );
  });

export const assignSlot = authorized
  .input(AssignSlotSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runAssignSlot(
      { ...input, adminId: context.user.id },
      context.repos.round0Slot
    );
  });

export const swapSlots = authorized
  .input(SwapSlotsSchema)
  .handler(async ({ input, context }) => {
    assertSystemAdmin(context.user);
    return runSwapSlots(
      { ...input, adminId: context.user.id },
      context.repos.round0Slot
    );
  });
